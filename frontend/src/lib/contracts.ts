import ZetaPolicy from "../../../../artifacts/contracts/ZetaPolicy.sol/ZetaPolicy.json";
import ZetaAgents from "../../../../artifacts/contracts/ZetaAgents.sol/ZetaAgents.json";
import ZetaOrderBook from "../../../../artifacts/contracts/ZetaOrderBook.sol/ZetaOrderBook.json";
import ZetaVault from "../../../../artifacts/contracts/ZetaVault.sol/ZetaVault.json";
import ZetaDisputes from "../../../../artifacts/contracts/ZetaDisputes.sol/ZetaDisputes.json";

export const contractAddresses = {
  policy: import.meta.env.VITE_CONTRACT_POLICY,
  agents: import.meta.env.VITE_CONTRACT_AGENTS,
  orderbook: import.meta.env.VITE_CONTRACT_ORDERBOOK,
  vault: import.meta.env.VITE_CONTRACT_VAULT,
  disputes: import.meta.env.VITE_CONTRACT_DISPUTES,
};

export const zetaPolicyAbi = ZetaPolicy.abi;
export const zetaAgentsAbi = ZetaAgents.abi;
export const zetaOrderBookAbi = ZetaOrderBook.abi;
export const zetaVaultAbi = ZetaVault.abi;
export const zetaDisputesAbi = ZetaDisputes.abi;