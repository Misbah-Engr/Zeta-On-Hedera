/* scripts/deploy.ts
 * One-admin deploy for Hedera testnet or local HH.
 * Env:
 *   POLICY_ADMIN=0x...           (defaults to deployer)
 *   TREASURY=0x...               (defaults to POLICY_ADMIN)
 *   PRIVATE_KEY=0x...            (must match POLICY_ADMIN on live nets)
 *   HEDERA_RPC_URL=...           (in hardhat.config.ts)
 */

import "dotenv/config";
import { setDefaultResultOrder } from "node:dns";
setDefaultResultOrder("ipv4first"); // prefer IPv4 to dodge WSL/IPv6 hiccups

import { ethers, upgrades, network } from "hardhat";
import type { Signer } from "ethers";

function isTransientNetErr(e: any): boolean {
  const s = (e?.code || e?.message || "").toString();
  return /ETIMEDOUT|ENETUNREACH|ECONNRESET|EAI_AGAIN|TIMEOUT/i.test(s);
}

async function withRetry<T>(label: string, fn: () => Promise<T>, retries = 5, baseMs = 1200): Promise<T> {
  let last: any;
  for (let i = 0; i < retries; i++) {
    try {
      const out = await fn();
      console.log(`${label} ✅`);
      return out;
    } catch (e) {
      last = e;
      if (!isTransientNetErr(e)) throw e;
      const delay = baseMs * (i + 1);
      console.warn(`${label} retry ${i + 1}/${retries} after ${e}`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw last ?? new Error(`${label} failed after ${retries} retries`);
}

async function ensureLocalFunds(addr: string) {
  if (network.name !== "hardhat" && network.name !== "localhost") return;
  const bal = await ethers.provider.getBalance(addr);
  if (bal < ethers.parseEther("1")) {
    await network.provider.send("hardhat_setBalance", [addr, "0x8AC7230489E80000"]); // 10 ETH
  }
}

async function getAdminSigner(adminAddr: string, deployer: Signer): Promise<Signer> {
  const deployerAddr = (await deployer.getAddress()).toLowerCase();
  const adminLower = adminAddr.toLowerCase();

  if (adminLower === deployerAddr) {
    await ensureLocalFunds(adminAddr);
    return deployer;
  }

  const pk = process.env.PRIVATE_KEY?.trim();
  if (pk) {
    const wallet = new ethers.Wallet(pk, ethers.provider);
    if (wallet.address.toLowerCase() !== adminLower) {
      throw new Error(`PRIVATE_KEY ${wallet.address} != POLICY_ADMIN ${adminAddr}`);
    }
    await ensureLocalFunds(wallet.address);
    return wallet;
  }

  if (network.name === "hardhat" || network.name === "localhost") {
    await network.provider.request({ method: "hardhat_impersonateAccount", params: [adminAddr] });
    await ensureLocalFunds(adminAddr);
    return await ethers.getSigner(adminAddr);
  }

  throw new Error("Admin signer unavailable. Provide PRIVATE_KEY for POLICY_ADMIN on live nets.");
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddr = await deployer.getAddress();

  const adminAddr = (process.env.POLICY_ADMIN || deployerAddr).trim();
  const treasuryAddr = (process.env.TREASURY || adminAddr).trim();

  console.log("Deployer:", deployerAddr);
  console.log("Admin   :", adminAddr);
  console.log("Treasury:", treasuryAddr);
  console.log("Network :", network.name);

  // --- Deploy proxies ---
  const PolicyF = await ethers.getContractFactory("ZetaPolicy");
  const policy = await upgrades.deployProxy(PolicyF, [adminAddr, treasuryAddr], { kind: "uups", initializer: "initialize" });
  await policy.waitForDeployment();
  const policyAddress = await policy.getAddress();
  console.log("ZetaPolicy  @", policyAddress);

  const VaultF = await ethers.getContractFactory("ZetaVault");
  const vault = await upgrades.deployProxy(VaultF, [adminAddr, policyAddress, ethers.ZeroAddress], { kind: "uups", initializer: "initialize" });
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("ZetaVault   @", vaultAddress);

  const AgentsF = await ethers.getContractFactory("ZetaAgents");
  const agents = await upgrades.deployProxy(AgentsF, [adminAddr, vaultAddress], { kind: "uups", initializer: "initialize" });
  await agents.waitForDeployment();
  const agentsAddress = await agents.getAddress();
  console.log("ZetaAgents  @", agentsAddress);

  const DisputesF = await ethers.getContractFactory("ZetaDisputes");
  const disputes = await upgrades.deployProxy(DisputesF, [adminAddr, policyAddress], { kind: "uups", initializer: "initialize" });
  await disputes.waitForDeployment();
  const disputesAddress = await disputes.getAddress();
  console.log("ZetaDisputes@", disputesAddress);

  const OrderBookF = await ethers.getContractFactory("ZetaOrderBook");
  const orderBook = await upgrades.deployProxy(
    OrderBookF,
    [adminAddr, policyAddress, agentsAddress, vaultAddress],
    { kind: "uups", initializer: "initialize" }
  );
  await orderBook.waitForDeployment();
  const orderBookAddress = await orderBook.getAddress();
  console.log("ZetaOrderBook@", orderBookAddress);

  // --- Admin signer ---
  const adminSigner = await getAdminSigner(adminAddr, deployer);
  const policyAsAdmin   = policy.connect(adminSigner);
  const vaultAsAdmin    = vault.connect(adminSigner);
  const agentsAsAdmin   = agents.connect(adminSigner);
  const disputesAsAdmin = disputes.connect(adminSigner);

  // Quick RPC ping (also exercises retry)
  await withRetry("RPC ping", async () => { await ethers.provider.getBlockNumber(); });

  console.log("\nWiring with admin…");

  await withRetry("Vault.setAgentsContract", async () =>
    (await vaultAsAdmin.setAgentsContract(agentsAddress)).wait()
  );

  await withRetry("Policy.setContractAddresses", async () =>
    (await policyAsAdmin.setContractAddresses(agentsAddress, orderBookAddress, vaultAddress, disputesAddress)).wait()
  );

  await withRetry("Disputes.setVaultContract", async () =>
    (await disputesAsAdmin.setVaultContract(vaultAddress)).wait()
  );

  console.log("\nGranting roles to admin…");
  const POLICY_ROLE_OPERATOR = await policy.ROLE_OPERATOR();
  const POLICY_ROLE_LISTING  = await policy.ROLE_LISTING();
  await withRetry("Policy.grantRole(OPERATOR)", async () =>
    (await policyAsAdmin.grantRole(POLICY_ROLE_OPERATOR, adminAddr)).wait()
  );
  await withRetry("Policy.grantRole(LISTING)", async () =>
    (await policyAsAdmin.grantRole(POLICY_ROLE_LISTING,  adminAddr)).wait()
  );

  const AGENTS_ROLE_LISTING = await agents.ROLE_LISTING();
  await withRetry("Agents.grantRole(LISTING)", async () =>
    (await agentsAsAdmin.grantRole(AGENTS_ROLE_LISTING, adminAddr)).wait()
  );

  console.log("\nDeployment complete:");
  console.log({
    network: network.name,
    policy: policyAddress,
    vault: vaultAddress,
    agents: agentsAddress,
    disputes: disputesAddress,
    orderBook: orderBookAddress,
    admin: adminAddr,
    treasury: treasuryAddr,
  });
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
