import { Abi } from "ethers";

export type ContractConfig = {
  name: string;
  address: string;
  abi: Abi;
  description?: string;
  roles?: { label: string; id: string }[];
};

const env = import.meta.env as Record<string, string | undefined>;

function resolveAddress(key: string): string {
  const viteKey = `VITE_${key}`;
  const direct = env[viteKey] || env[key];
  return direct ?? "";
}

export const RPC_URL = env.VITE_RPC_URL ?? "https://testnet.hashio.io/api";

export const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
export const ROLE_POLICY_ADMIN = "0xb6652ef5536f03f8263baa70f5d3796a2d1ef3014811f3b9b296298a730ddc26"; // keccak256("ROLE_POLICY_ADMIN")
export const ROLE_OPERATOR = "0x69c632f0dc196dcf0ec6a3ad0cc10908df87a4db504a76af5a985c0d19af6721"; // keccak256("ROLE_OPERATOR")
export const ROLE_LISTING = "0xac8f0465ac856633dfe756564c9dff2fe26e3241ed5e20026887266a7698840a"; // keccak256("ROLE_LISTING")

export const ZETA_POLICY_ABI: Abi = [
  { inputs: [], name: "ROLE_OPERATOR", outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "ROLE_LISTING", outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "DEFAULT_ADMIN_ROLE", outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "treasury", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "allowedToken", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "treasuryBps", outputs: [{ internalType: "uint16", name: "", type: "uint16" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "defaultHoldbackBps", outputs: [{ internalType: "uint16", name: "", type: "uint16" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "defaultMicrobondBps", outputs: [{ internalType: "uint16", name: "", type: "uint16" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "claimWindowSec", outputs: [{ internalType: "uint32", name: "", type: "uint32" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "acceptAckWindowSec", outputs: [{ internalType: "uint32", name: "", type: "uint32" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "", type: "address" }], name: "userBanned", outputs: [{ internalType: "bool", name: "", type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "", type: "address" }], name: "agentBanned", outputs: [{ internalType: "bool", name: "", type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "zetaAgents", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "zetaOrderBook", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "zetaVault", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "zetaDisputes", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "paused", outputs: [{ internalType: "bool", name: "", type: "bool" }], stateMutability: "view", type: "function" },
  {
    inputs: [
      { internalType: "address", name: "admin", type: "address" },
      { internalType: "address", name: "_treasury", type: "address" }
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "_treasury", type: "address" },
      { internalType: "address", name: "_allowedToken", type: "address" },
      { internalType: "uint16", name: "_treasuryBps", type: "uint16" },
      { internalType: "uint16", name: "_holdbackBps", type: "uint16" },
      { internalType: "uint16", name: "_microBps", type: "uint16" },
      { internalType: "uint32", name: "_claimWin", type: "uint32" },
      { internalType: "uint32", name: "_ackWin", type: "uint32" }
    ],
    name: "setParams",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  { inputs: [], name: "pause", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "unpause", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    inputs: [
      { internalType: "address", name: "_zetaAgents", type: "address" },
      { internalType: "address", name: "_zetaOrderBook", type: "address" },
      { internalType: "address", name: "_zetaVault", type: "address" },
      { internalType: "address", name: "_zetaDisputes", type: "address" }
    ],
    name: "setContractAddresses",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "who", type: "address" },
      { internalType: "bool", name: "flag", type: "bool" }
    ],
    name: "banUser",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "who", type: "address" },
      { internalType: "bool", name: "flag", type: "bool" }
    ],
    name: "banAgent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" }
    ],
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" }
    ],
    name: "revokeRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" }
    ],
    name: "renounceRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" }
    ],
    name: "hasRole",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  { inputs: [{ internalType: "bytes32", name: "role", type: "bytes32" }], name: "getRoleAdmin", outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "bytes4", name: "interfaceId", type: "bytes4" }], name: "supportsInterface", outputs: [{ internalType: "bool", name: "", type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "proxiableUUID", outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "newImplementation", type: "address" }], name: "upgradeTo", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    inputs: [
      { internalType: "address", name: "newImplementation", type: "address" },
      { internalType: "bytes", name: "data", type: "bytes" }
    ],
    name: "upgradeToAndCall",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  }
];

export const ZETA_AGENTS_ABI: Abi = [
  { inputs: [], name: "ROLE_LISTING", outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "DEFAULT_ADMIN_ROLE", outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "vault", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "", type: "address" }], name: "agents", outputs: [
    { internalType: "bool", name: "whitelisted", type: "bool" },
    { internalType: "uint16", name: "riskScoreBps", type: "uint16" },
    { internalType: "bytes32", name: "feeScheduleCid", type: "bytes32" }
  ], stateMutability: "view", type: "function" },
  {
    inputs: [
      { internalType: "address", name: "admin", type: "address" },
      { internalType: "address", name: "vaultAddr", type: "address" }
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  { inputs: [{ internalType: "address", name: "agent", type: "address" }], name: "whitelist", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "address", name: "agent", type: "address" }], name: "unlist", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    inputs: [
      { internalType: "address", name: "agent", type: "address" },
      { internalType: "uint16", name: "bps", type: "uint16" }
    ],
    name: "setRisk",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  { inputs: [{ internalType: "bytes32", name: "cid", type: "bytes32" }], name: "setFeeAnchor", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }], name: "bondDeposit", outputs: [], stateMutability: "payable", type: "function" },
  { inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }], name: "bondWithdraw", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "address", name: "agent", type: "address" }], name: "riskScore", outputs: [{ internalType: "uint16", name: "", type: "uint16" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "agent", type: "address" }], name: "isWhitelisted", outputs: [{ internalType: "bool", name: "", type: "bool" }], stateMutability: "view", type: "function" },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" }
    ],
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" }
    ],
    name: "revokeRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" }
    ],
    name: "renounceRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" }
    ],
    name: "hasRole",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  { inputs: [{ internalType: "bytes32", name: "role", type: "bytes32" }], name: "getRoleAdmin", outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "bytes4", name: "interfaceId", type: "bytes4" }], name: "supportsInterface", outputs: [{ internalType: "bool", name: "", type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "proxiableUUID", outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "newImplementation", type: "address" }], name: "upgradeTo", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    inputs: [
      { internalType: "address", name: "newImplementation", type: "address" },
      { internalType: "bytes", name: "data", type: "bytes" }
    ],
    name: "upgradeToAndCall",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  }
];

export const ZETA_ORDERBOOK_ABI: Abi = [
  { inputs: [], name: "policy", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "agents", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "vault", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "nextOrderId", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "orders",
    outputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "maxTotal", type: "uint256" },
      { internalType: "bytes32", name: "originShopId", type: "bytes32" },
      { internalType: "bytes32", name: "destRegion", type: "bytes32" },
      { internalType: "bytes32", name: "commodityId", type: "bytes32" },
      { internalType: "uint256", name: "qty", type: "uint256" },
      { internalType: "uint64", name: "createdAt", type: "uint64" },
      { internalType: "uint64", name: "expiry", type: "uint64" },
      { internalType: "uint8", name: "status", type: "uint8" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "address", name: "", type: "address" }
    ],
    name: "commits",
    outputs: [
      { internalType: "bytes32", name: "commit", type: "bytes32" },
      { internalType: "uint64", name: "ttl", type: "uint64" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "address", name: "", type: "address" }
    ],
    name: "revealed",
    outputs: [
      { internalType: "uint256", name: "feeTotal", type: "uint256" },
      { internalType: "uint16", name: "holdbackBps", type: "uint16" },
      { internalType: "uint16", name: "microbondBps", type: "uint16" },
      { internalType: "uint32", name: "etaHours", type: "uint32" }
    ],
    stateMutability: "view",
    type: "function"
  },
  { inputs: [{ internalType: "uint256", name: "", type: "uint256" }, { internalType: "uint256", name: "", type: "uint256" }], name: "candidateAgents", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "uint256", name: "", type: "uint256" }], name: "selectedAgent", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "uint256", name: "", type: "uint256" }], name: "selectedAt", outputs: [{ internalType: "uint64", name: "", type: "uint64" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "weightPrice", outputs: [{ internalType: "uint32", name: "", type: "uint32" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "weightEta", outputs: [{ internalType: "uint32", name: "", type: "uint32" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "weightRisk", outputs: [{ internalType: "uint32", name: "", type: "uint32" }], stateMutability: "view", type: "function" },
  {
    inputs: [
      { internalType: "address", name: "admin", type: "address" },
      { internalType: "address", name: "policyAddr", type: "address" },
      { internalType: "address", name: "agentsAddr", type: "address" },
      { internalType: "address", name: "vaultAddr", type: "address" }
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "maxTotal", type: "uint256" },
      { internalType: "bytes32", name: "originShopId", type: "bytes32" },
      { internalType: "bytes32", name: "destRegion", type: "bytes32" },
      { internalType: "bytes32", name: "commodityId", type: "bytes32" },
      { internalType: "uint256", name: "qty", type: "uint256" },
      { internalType: "uint64", name: "expiry", type: "uint64" }
    ],
    name: "createOrderIntent",
    outputs: [{ internalType: "uint256", name: "orderId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "orderId", type: "uint256" },
      { internalType: "bytes32", name: "commit", type: "bytes32" },
      { internalType: "uint64", name: "ttl", type: "uint64" }
    ],
    name: "commitQuote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "orderId", type: "uint256" },
      { internalType: "uint256", name: "feeTotal", type: "uint256" },
      { internalType: "uint16", name: "holdbackBps", type: "uint16" },
      { internalType: "uint16", name: "microbondBps", type: "uint16" },
      { internalType: "uint32", name: "etaHours", type: "uint32" },
      { internalType: "bytes32", name: "salt", type: "bytes32" }
    ],
    name: "revealQuote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  { inputs: [{ internalType: "uint256", name: "orderId", type: "uint256" }], name: "autoSelect", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "uint256", name: "orderId", type: "uint256" }], name: "ackSelect", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    inputs: [
      { internalType: "uint256", name: "orderId", type: "uint256" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "userFund",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  { inputs: [{ internalType: "uint256", name: "orderId", type: "uint256" }], name: "markCompleted", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "uint256", name: "orderId", type: "uint256" }], name: "cancel", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "paused", outputs: [{ internalType: "bool", name: "", type: "bool" }], stateMutability: "view", type: "function" },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" }
    ],
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" }
    ],
    name: "revokeRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" }
    ],
    name: "renounceRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" }
    ],
    name: "hasRole",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  { inputs: [{ internalType: "bytes32", name: "role", type: "bytes32" }], name: "getRoleAdmin", outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "bytes4", name: "interfaceId", type: "bytes4" }], name: "supportsInterface", outputs: [{ internalType: "bool", name: "", type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "proxiableUUID", outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "newImplementation", type: "address" }], name: "upgradeTo", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    inputs: [
      { internalType: "address", name: "newImplementation", type: "address" },
      { internalType: "bytes", name: "data", type: "bytes" }
    ],
    name: "upgradeToAndCall",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  }
];

export const ZETA_VAULT_ABI: Abi = [
  { inputs: [], name: "policy", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "agents", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "orderLocks",
    outputs: [
      { internalType: "uint256", name: "userLock", type: "uint256" },
      { internalType: "address", name: "user", type: "address" },
      { internalType: "uint256", name: "holdback", type: "uint256" },
      { internalType: "uint256", name: "agentDue", type: "uint256" },
      { internalType: "uint256", name: "microbond", type: "uint256" },
      { internalType: "uint256", name: "treasuryAmount", type: "uint256" },
      { internalType: "address", name: "agent", type: "address" },
      { internalType: "uint64", name: "lockedAt", type: "uint64" },
      { internalType: "bool", name: "paidMain", type: "bool" },
      { internalType: "bool", name: "holdReleased", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  { inputs: [{ internalType: "address", name: "", type: "address" }], name: "standingBond", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  {
    inputs: [
      { internalType: "address", name: "admin", type: "address" },
      { internalType: "address", name: "policyAddr", type: "address" },
      { internalType: "address", name: "agentsAddr", type: "address" }
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  { inputs: [{ internalType: "address", name: "agentsAddr", type: "address" }], name: "setAgentsContract", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    inputs: [
      { internalType: "address", name: "agent", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "increaseStandingBond",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "agent", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "decreaseStandingBond",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "orderId", type: "uint256" },
      { internalType: "uint256", name: "feeTotal", type: "uint256" },
      { internalType: "uint16", name: "holdbackBps", type: "uint16" },
      { internalType: "uint16", name: "microBps", type: "uint16" },
      { internalType: "address", name: "agent", type: "address" },
      { internalType: "address", name: "user", type: "address" }
    ],
    name: "onAccepted",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "orderId", type: "uint256" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "userFund",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  { inputs: [{ internalType: "uint256", name: "orderId", type: "uint256" }], name: "markCompleted", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "uint256", name: "orderId", type: "uint256" }], name: "releaseHoldback", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    inputs: [
      { internalType: "uint256", name: "orderId", type: "uint256" },
      { internalType: "uint256", name: "toUserAmount", type: "uint256" },
      { internalType: "uint256", name: "toTreasuryAmount", type: "uint256" }
    ],
    name: "slashForFault",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" }
    ],
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" }
    ],
    name: "revokeRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" }
    ],
    name: "renounceRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" }
    ],
    name: "hasRole",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  { inputs: [{ internalType: "bytes32", name: "role", type: "bytes32" }], name: "getRoleAdmin", outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "bytes4", name: "interfaceId", type: "bytes4" }], name: "supportsInterface", outputs: [{ internalType: "bool", name: "", type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "proxiableUUID", outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "newImplementation", type: "address" }], name: "upgradeTo", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    inputs: [
      { internalType: "address", name: "newImplementation", type: "address" },
      { internalType: "bytes", name: "data", type: "bytes" }
    ],
    name: "upgradeToAndCall",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  }
];

export const ZETA_DISPUTES_ABI: Abi = [
  { inputs: [], name: "policy", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "vault", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "uint256", name: "", type: "uint256" }], name: "disputeState", outputs: [{ internalType: "uint8", name: "", type: "uint8" }], stateMutability: "view", type: "function" },
  {
    inputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    name: "orderPods",
    outputs: [
      { internalType: "bytes32", name: "hash", type: "bytes32" },
      { internalType: "uint8", name: "kind", type: "uint8" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    name: "userClaims",
    outputs: [
      { internalType: "bytes32", name: "hash", type: "bytes32" },
      { internalType: "uint8", name: "kind", type: "uint8" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "admin", type: "address" },
      { internalType: "address", name: "policyAddr", type: "address" }
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  { inputs: [{ internalType: "address", name: "vaultAddr", type: "address" }], name: "setVaultContract", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    inputs: [
      { internalType: "uint256", name: "orderId", type: "uint256" },
      { internalType: "bytes32[]", name: "hashes", type: "bytes32[]" },
      { internalType: "uint8[]", name: "kinds", type: "uint8[]" }
    ],
    name: "submitPoD",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "orderId", type: "uint256" },
      { internalType: "bytes32[]", name: "hashes", type: "bytes32[]" },
      { internalType: "uint8[]", name: "kinds", type: "uint8[]" }
    ],
    name: "openClaim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  { inputs: [{ internalType: "uint256", name: "orderId", type: "uint256" }], name: "autoResolve", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" }
    ],
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" }
    ],
    name: "revokeRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" }
    ],
    name: "renounceRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" }
    ],
    name: "hasRole",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  { inputs: [{ internalType: "bytes32", name: "role", type: "bytes32" }], name: "getRoleAdmin", outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "bytes4", name: "interfaceId", type: "bytes4" }], name: "supportsInterface", outputs: [{ internalType: "bool", name: "", type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "proxiableUUID", outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "newImplementation", type: "address" }], name: "upgradeTo", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    inputs: [
      { internalType: "address", name: "newImplementation", type: "address" },
      { internalType: "bytes", name: "data", type: "bytes" }
    ],
    name: "upgradeToAndCall",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  }
];

const policyAddress = resolveAddress("POLICY_ADDR");
const agentsAddress = resolveAddress("AGENTS_ADDR");
const vaultAddress = resolveAddress("VAULT_ADDR");
const disputesAddress = resolveAddress("DISPUTES_ADDR");
const orderbookAddress = resolveAddress("ORDERBOOK_ADDR");

export const CONTRACTS: ContractConfig[] = [
  {
    name: "ZetaPolicy",
    address: policyAddress,
    abi: ZETA_POLICY_ABI,
    description: "Protocol governance, parameters, and role management.",
    roles: [
      { label: "Default Admin", id: DEFAULT_ADMIN_ROLE },
      { label: "Policy Admin", id: ROLE_POLICY_ADMIN },
      { label: "Operator", id: ROLE_OPERATOR },
      { label: "Listing", id: ROLE_LISTING }
    ]
  },
  {
    name: "ZetaAgents",
    address: agentsAddress,
    abi: ZETA_AGENTS_ABI,
    description: "Agent whitelisting, risk, and standing bond controls.",
    roles: [
      { label: "Default Admin", id: DEFAULT_ADMIN_ROLE },
      { label: "Policy Admin", id: ROLE_POLICY_ADMIN },
      { label: "Listing", id: ROLE_LISTING }
    ]
  },
  {
    name: "ZetaOrderBook",
    address: orderbookAddress,
    abi: ZETA_ORDERBOOK_ABI,
    description: "Order lifecycle: intents, quotes, selection, and execution.",
    roles: [
      { label: "Default Admin", id: DEFAULT_ADMIN_ROLE },
      { label: "Policy Admin", id: ROLE_POLICY_ADMIN }
    ]
  },
  {
    name: "ZetaVault",
    address: vaultAddress,
    abi: ZETA_VAULT_ABI,
    description: "Escrow flows, treasury payouts, and standing bond custody.",
    roles: [
      { label: "Default Admin", id: DEFAULT_ADMIN_ROLE },
      { label: "Policy Admin", id: ROLE_POLICY_ADMIN }
    ]
  },
  {
    name: "ZetaDisputes",
    address: disputesAddress,
    abi: ZETA_DISPUTES_ABI,
    description: "Proof-of-delivery submissions, claims, and dispute resolution.",
    roles: [
      { label: "Default Admin", id: DEFAULT_ADMIN_ROLE },
      { label: "Policy Admin", id: ROLE_POLICY_ADMIN }
    ]
  }
];

export const CONTRACT_MAP = Object.fromEntries(CONTRACTS.map((contract) => [contract.name, contract]));

export const ROLE_IDS = {
  DEFAULT_ADMIN_ROLE,
  ROLE_POLICY_ADMIN,
  ROLE_OPERATOR,
  ROLE_LISTING
};
