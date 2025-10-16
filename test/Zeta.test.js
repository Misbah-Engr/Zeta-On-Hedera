const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Zeta Protocol", function () {
  async function deployContractsFixture() {
    const [admin, treasury, user, agent1, agent2] = await ethers.getSigners();

    const ZetaPolicy = await ethers.getContractFactory("ZetaPolicy");
    const policy = await upgrades.deployProxy(ZetaPolicy, [admin.address, treasury.address], { kind: "uups" });

    const ZetaVault = await ethers.getContractFactory("ZetaVault");
    const vault = await upgrades.deployProxy(ZetaVault, [admin.address, await policy.getAddress(), ethers.ZeroAddress], { kind: "uups" });

    const ZetaAgents = await ethers.getContractFactory("ZetaAgents");
    const agents = await upgrades.deployProxy(ZetaAgents, [admin.address, await vault.getAddress()], { kind: "uups" });
    await agents.grantRole(await agents.ROLE_LISTING(), admin.address);

    await vault.setAgentsContract(await agents.getAddress());

    const ZetaDisputes = await ethers.getContractFactory("ZetaDisputes");
    const disputes = await upgrades.deployProxy(ZetaDisputes, [admin.address, await policy.getAddress()], { kind: "uups" });

    const ZetaOrderBook = await ethers.getContractFactory("ZetaOrderBook");
    const orderBook = await upgrades.deployProxy(ZetaOrderBook, [admin.address, await policy.getAddress(), await agents.getAddress(), await vault.getAddress()], { kind: "uups" });

    await policy.setContractAddresses(
        await agents.getAddress(),
        await orderBook.getAddress(),
        await vault.getAddress(),
        await disputes.getAddress()
    );

    await disputes.setVaultContract(await vault.getAddress());

    return { policy, vault, agents, disputes, orderBook, admin, treasury, user, agent1, agent2 };
  }

  describe("Full Order Lifecycle (Happy Path)", function () {
    it("Should allow a user to create an order, an agent to fulfill it, and funds to be released correctly", async function () {
      const { policy, vault, agents, orderBook, admin, user, agent1 } = await loadFixture(deployContractsFixture);

      // 1. Whitelist agent
      await agents.connect(admin).whitelist(agent1.address);
      expect(await agents.isWhitelisted(agent1.address)).to.be.true;

      // 2. Agent deposits standing bond
      const bondAmount = ethers.parseEther("10");
      await agents.connect(agent1).bondDeposit(bondAmount, { value: bondAmount });
      expect(await vault.standingBond(agent1.address)).to.equal(bondAmount);

      // 3. User creates an order intent
      const maxTotal = ethers.parseEther("1.0");
      const expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const createOrderTx = await orderBook.connect(user).createOrderIntent(
        ethers.ZeroAddress, // HBAR token
        maxTotal,
        ethers.id("shop1"),
        ethers.id("regionA"),
        ethers.id("productX"),
        1,
        expiry
      );
      const createOrderReceipt = await createOrderTx.wait();
      const orderId = createOrderReceipt.logs.find(
        (event) => event.fragment.name === "OrderCreated"
      ).args[0];
      console.log("orderId", orderId);

      // 4. Agent commits a quote
      const feeTotal = ethers.parseEther("0.9");
      const salt = ethers.id("random-salt");
      const commit = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256", "uint16", "uint16", "uint32", "bytes32"],
        [orderId, feeTotal, 500, 500, 24, salt]
      ));
      const ttl = expiry;
      await orderBook.connect(agent1).commitQuote(orderId, commit, ttl);

      // 5. Agent reveals the quote
      await orderBook.connect(agent1).revealQuote(orderId, feeTotal, 500, 500, 24, salt);

      // 6. Auto-select the agent
      await orderBook.autoSelect(orderId);
      expect(await orderBook.selectedAgent(orderId)).to.equal(agent1.address);

      // 7. Agent acknowledges the selection
      await expect(orderBook.connect(agent1).ackSelect(orderId))
        .to.emit(orderBook, "OrderAccepted")
        .withArgs(orderId, agent1.address);

      // 8. User funds the order
      await expect(orderBook.connect(user).userFund(orderId, feeTotal, { value: feeTotal }))
        .to.emit(vault, "UserFunded")
        .withArgs(orderId, feeTotal);

      // 9. Mark order as completed (e.g., after PoD)
      await expect(orderBook.connect(admin).markCompleted(orderId))
        .to.emit(vault, "Paid");

      // 10. Release holdback after claim window
      await ethers.provider.send("evm_increaseTime", [72 * 3600 + 1]);
      await ethers.provider.send("evm_mine");

      await expect(vault.releaseHoldback(orderId))
        .to.emit(vault, "HoldReleased");
    });
  });

  describe("Dispute and Slashing", function () {
    it("Should slash the agent's bond if a dispute is resolved in favor of the user", async function () {
      const { policy, vault, agents, disputes, orderBook, admin, user, agent1 } = await loadFixture(deployContractsFixture);

      // Setup: Complete order up to the funding stage
      await agents.connect(admin).whitelist(agent1.address);
      const bondAmount = ethers.parseEther("10");
      await agents.connect(agent1).bondDeposit(bondAmount, { value: bondAmount });
      const maxTotal = ethers.parseEther("1.0");
      const feeTotal = ethers.parseEther("0.9");
      const expiry = Math.floor(Date.now() / 1000) + 3600;
      await orderBook.connect(user).createOrderIntent(
        ethers.ZeroAddress,
        maxTotal,
        ethers.id("shop2"),
        ethers.id("regionB"),
        ethers.id("productY"),
        1,
        expiry
      );
      const orderId = 1;
      const salt = ethers.id("random-salt");
      const commit = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256", "uint16", "uint16", "uint32", "bytes32"],
        [orderId, feeTotal, 500, 500, 24, salt]
      ));
      await orderBook.connect(agent1).commitQuote(orderId, commit, expiry);
      await orderBook.connect(agent1).revealQuote(orderId, feeTotal, 500, 500, 24, salt);
      await orderBook.autoSelect(orderId);
      await orderBook.connect(agent1).ackSelect(orderId);
      await orderBook.connect(user).userFund(orderId, feeTotal, { value: feeTotal });
      await orderBook.connect(admin).markCompleted(orderId);

      // 1. User opens a claim
      await disputes.connect(user).openClaim(orderId, [ethers.id("proof")], [1]);
      expect(await disputes.disputeState(orderId)).to.equal(1); // 1 = Open

      // 2. Admin resolves the dispute. Since agent has not submitted PoD, the user's claim is approved.
      await expect(disputes.connect(admin).autoResolve(orderId))
          .to.emit(vault, "Slashed")
          .withArgs(orderId, feeTotal, 0, ethers.parseEther("0.81")); // toUser, toTreasury, fromStandingBond

      expect(await disputes.disputeState(orderId)).to.equal(2); // 2 = Resolved
    });

    it("Should deny a dispute if the agent provides Proof of Delivery", async function () {
      const { vault, agents, disputes, orderBook, admin, user, agent1 } = await loadFixture(deployContractsFixture);

      // Setup: Complete order up to the funding stage
      await agents.connect(admin).whitelist(agent1.address);
      const bondAmount = ethers.parseEther("10");
      await agents.connect(agent1).bondDeposit(bondAmount, { value: bondAmount });
      const maxTotal = ethers.parseEther("1.0");
      const feeTotal = ethers.parseEther("0.9");
      const expiry = Math.floor(Date.now() / 1000) + 3600;
      await orderBook.connect(user).createOrderIntent(
        ethers.ZeroAddress, maxTotal, ethers.id("shop3"), ethers.id("regionC"), ethers.id("productZ"), 1, expiry
      );
      const orderId = 1;
      const salt = ethers.id("random-salt");
      const commit = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256", "uint16", "uint16", "uint32", "bytes32"],
        [orderId, feeTotal, 500, 500, 24, salt]
      ));
      await orderBook.connect(agent1).commitQuote(orderId, commit, expiry);
      await orderBook.connect(agent1).revealQuote(orderId, feeTotal, 500, 500, 24, salt);
      await orderBook.autoSelect(orderId);
      await orderBook.connect(agent1).ackSelect(orderId);
      await orderBook.connect(user).userFund(orderId, feeTotal, { value: feeTotal });
      await orderBook.connect(admin).markCompleted(orderId);

      // 1. Agent submits PoD
      await disputes.connect(agent1).submitPoD(orderId, [ethers.id("agent-proof")], [1]);

      // 2. User opens a claim
      await disputes.connect(user).openClaim(orderId, [ethers.id("user-proof")], [1]);

      // 3. Advance time past the claim window
      await ethers.provider.send("evm_increaseTime", [72 * 3600 + 1]);
      await ethers.provider.send("evm_mine");

      // 4. Admin resolves the dispute. Since agent has submitted PoD, the user's claim is denied.
      await expect(disputes.connect(admin).autoResolve(orderId))
        .to.emit(vault, "HoldReleased");

      expect(await disputes.disputeState(orderId)).to.equal(2); // 2 = Resolved
    });
  });
});
