import { ethers, upgrades } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  // Fallback to deployer if specific roles aren't set in .env
  const admin = process.env.POLICY_ADMIN || deployer.address;
  const treasury = process.env.TREASURY || deployer.address;

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Admin will be:", admin);
  console.log("Treasury will be:", treasury);

  // 1. Deploy ZetaPolicy
  const Policy = await ethers.getContractFactory("ZetaPolicy");
  const policy = await upgrades.deployProxy(Policy, [admin, treasury], { kind: "uups", initializer: "initialize" });
  await policy.waitForDeployment();
  const policyAddress = await policy.getAddress();
  console.log("ZetaPolicy deployed to:", policyAddress);

  // 2. Deploy ZetaVault (with placeholder for agents address)
  const Vault = await ethers.getContractFactory("ZetaVault");
  const vault = await upgrades.deployProxy(Vault, [admin, policyAddress, ethers.ZeroAddress], { kind: "uups", initializer: "initialize" });
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("ZetaVault deployed to:", vaultAddress);

  // 3. Deploy ZetaAgents
  const Agents = await ethers.getContractFactory("ZetaAgents");
  const agents = await upgrades.deployProxy(Agents, [admin, vaultAddress], { kind: "uups", initializer: "initialize" });
  await agents.waitForDeployment();
  const agentsAddress = await agents.getAddress();
  console.log("ZetaAgents deployed to:", agentsAddress);

  // 4. Deploy ZetaDisputes
  const Disputes = await ethers.getContractFactory("ZetaDisputes");
  const disputes = await upgrades.deployProxy(Disputes, [admin, policyAddress], { kind: "uups", initializer: "initialize" });
  await disputes.waitForDeployment();
  const disputesAddress = await disputes.getAddress();
  console.log("ZetaDisputes deployed to:", disputesAddress);

  // 5. Deploy ZetaOrderBook
  const OrderBook = await ethers.getContractFactory("ZetaOrderBook");
  const orderBook = await upgrades.deployProxy(OrderBook, [admin, policyAddress, agentsAddress, vaultAddress], { kind: "uups", initializer: "initialize" });
  await orderBook.waitForDeployment();
  const orderBookAddress = await orderBook.getAddress();
  console.log("ZetaOrderBook deployed to:", orderBookAddress);

  // --- Wire up contract dependencies ---
  console.log("\nWiring up contract dependencies...");

  // Set agents address in Vault
  console.log("Setting agents contract address in ZetaVault...");
  await vault.setAgentsContract(agentsAddress);

  // Set all contract addresses in Policy
  console.log("Setting all contract addresses in ZetaPolicy...");
  await policy.setContractAddresses(
    agentsAddress,
    orderBookAddress,
    vaultAddress,
    disputesAddress
  );

  // Set vault address in Disputes
  console.log("Setting vault contract address in ZetaDisputes...");
  await disputes.setVaultContract(vaultAddress);

  // Grant necessary roles if deployer is also admin
  if (admin === deployer.address) {
    console.log("Granting LISTING_ROLE to admin in ZetaAgents...");
    const LISTING_ROLE = await agents.ROLE_LISTING();
    await agents.grantRole(LISTING_ROLE, admin);
  }

  console.log("\nDeployment and setup complete!");
  console.log({
    policy: policyAddress,
    vault: vaultAddress,
    agents: agentsAddress,
    disputes: disputesAddress,
    orderBook: orderBookAddress,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
