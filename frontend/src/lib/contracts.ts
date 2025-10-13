// Contains ABI and address map for smart contracts.

export const contractAddresses = {
  policy: import.meta.env.VITE_CONTRACT_POLICY,
  agents: import.meta.env.VITE_CONTRACT_AGENTS,
  orderbook: import.meta.env.VITE_CONTRACT_ORDERBOOK,
  vault: import.meta.env.VITE_CONTRACT_VAULT,
  disputes: import.meta.env.VITE_CONTRACT_DISPUTES,
};

// In a real application, you would also export the ABIs here,
// likely imported from your Hardhat artifacts.
// export const zetaOrderBookAbi = [...]
