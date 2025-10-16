// scripts/wire.ts
import "dotenv/config";
import { setDefaultResultOrder } from "node:dns";
setDefaultResultOrder("ipv4first"); // dodge IPv6 weirdness on WSL

import { ethers, artifacts, network } from "hardhat";

function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v.trim();
}
function transient(e: any): boolean {
  const s = (e?.code || e?.message || "").toString();
  return /ETIMEDOUT|ENETUNREACH|ECONNRESET|EAI_AGAIN|TIMEOUT/i.test(s);
}
async function withRetry<T>(label: string, fn: () => Promise<T>, tries = 6, baseMs = 1000): Promise<T> {
  let last: any;
  for (let i = 1; i <= tries; i++) {
    try {
      const out = await fn();
      console.log(`${label} ✅`);
      return out;
    } catch (e) {
      last = e;
      if (!transient(e)) throw e;
      const delay = baseMs * i;
      console.warn(`${label} retry ${i}/${tries}: ${e?.code || e?.message || e}`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw last ?? new Error(`${label} failed after ${tries} retries`);
}

async function main() {
  // --- env: paste your deploy outputs here ---
  const POLICY_ADMIN = need("POLICY_ADMIN");
  const PRIVATE_KEY  = need("PRIVATE_KEY");
  const POLICY_ADDR  = need("POLICY_ADDR");
  const VAULT_ADDR   = need("VAULT_ADDR");
  const AGENTS_ADDR  = need("AGENTS_ADDR");
  const DISPUTES_ADDR= need("DISPUTES_ADDR");
  const ORDERBOOK_ADDR = need("ORDERBOOK_ADDR");

  // sanity: we’re on the hardhat-configured hedera_testnet provider
  const net = await ethers.provider.getNetwork();
  console.log(`Network: ${network.name} (chainId=${net.chainId})`);

  // admin signer bound to THIS provider
  const admin = new ethers.Wallet(PRIVATE_KEY, ethers.provider);
  if (admin.address.toLowerCase() !== POLICY_ADMIN.toLowerCase()) {
    throw new Error(`PRIVATE_KEY ${admin.address} != POLICY_ADMIN ${POLICY_ADMIN}`);
  }

  // ABIs
  const policyAbi   = (await artifacts.readArtifact("ZetaPolicy")).abi;
  const vaultAbi    = (await artifacts.readArtifact("ZetaVault")).abi;
  const agentsAbi   = (await artifacts.readArtifact("ZetaAgents")).abi;
  const disputesAbi = (await artifacts.readArtifact("ZetaDisputes")).abi;

  // Contracts (admin signer)
  const policy   = new ethers.Contract(POLICY_ADDR,   policyAbi,   admin);
  const vault    = new ethers.Contract(VAULT_ADDR,    vaultAbi,    admin);
  const agents   = new ethers.Contract(AGENTS_ADDR,   agentsAbi,   admin);
  const disputes = new ethers.Contract(DISPUTES_ADDR, disputesAbi, admin);

  // --- Wiring (idempotent) ---
  console.log("\nWiring…");

  // Vault <- Agents
  const curAgents = await vault.agents();
  if (curAgents.toLowerCase() !== AGENTS_ADDR.toLowerCase()) {
    await withRetry("Vault.setAgentsContract", async () =>
      (await vault.setAgentsContract(AGENTS_ADDR)).wait()
    );
  } else {
    console.log("Vault.setAgentsContract (already set) ✅");
  }

  // Policy <- suite
  const pa = await policy.zetaAgents();
  const po = await policy.zetaOrderBook();
  const pv = await policy.zetaVault();
  const pd = await policy.zetaDisputes();
  const needSet =
    pa.toLowerCase() !== AGENTS_ADDR.toLowerCase() ||
    po.toLowerCase() !== ORDERBOOK_ADDR.toLowerCase() ||
    pv.toLowerCase() !== VAULT_ADDR.toLowerCase() ||
    pd.toLowerCase() !== DISPUTES_ADDR.toLowerCase();
  if (needSet) {
    await withRetry("Policy.setContractAddresses", async () =>
      (await policy.setContractAddresses(AGENTS_ADDR, ORDERBOOK_ADDR, VAULT_ADDR, DISPUTES_ADDR)).wait()
    );
  } else {
    console.log("Policy.setContractAddresses (already set) ✅");
  }

  // Disputes <- Vault
  const curVault = await disputes.vault();
  if (curVault.toLowerCase() !== VAULT_ADDR.toLowerCase()) {
    await withRetry("Disputes.setVaultContract", async () =>
      (await disputes.setVaultContract(VAULT_ADDR)).wait()
    );
  } else {
    console.log("Disputes.setVaultContract (already set) ✅");
  }

  // --- Roles (idempotent) ---
  console.log("\nGranting roles to admin…");

  const ROLE_OP  = await policy.ROLE_OPERATOR();
  const ROLE_LST = await policy.ROLE_LISTING();

  if (!(await policy.hasRole(ROLE_OP, POLICY_ADMIN))) {
    await withRetry("Policy.grantRole(OPERATOR)", async () =>
      (await policy.grantRole(ROLE_OP, POLICY_ADMIN)).wait()
    );
  } else { console.log("Policy.OPERATOR already granted ✅"); }

  if (!(await policy.hasRole(ROLE_LST, POLICY_ADMIN))) {
    await withRetry("Policy.grantRole(LISTING)", async () =>
      (await policy.grantRole(ROLE_LST, POLICY_ADMIN)).wait()
    );
  } else { console.log("Policy.LISTING already granted ✅"); }

  const AGENTS_ROLE_LST = await agents.ROLE_LISTING();
  if (!(await agents.hasRole(AGENTS_ROLE_LST, POLICY_ADMIN))) {
    await withRetry("Agents.grantRole(LISTING)", async () =>
      (await agents.grantRole(AGENTS_ROLE_LST, POLICY_ADMIN)).wait()
    );
  } else { console.log("Agents.LISTING already granted ✅"); }

  console.log("\nWiring complete ✅");
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
