# Zeta | Hedera Global Onchain

Zeta is a minimal, explicit, and executable onchain logistics escrow platform built on the Hedera EVM. This repository contains the core smart contracts for the Zeta protocol.

## Smart Contracts

The Zeta protocol is composed of five core smart contracts that work together to manage the lifecycle of a logistics order:

*   **`ZetaPolicy.sol`**: The central authority for the protocol. It manages system-wide parameters, such as treasury fees, claim windows, and allowed tokens. It also controls the addresses of the other core contracts and handles the banning of users and agents.
*   **`ZetaAgents.sol`**: Manages the agents who fulfill the logistics orders. It handles agent whitelisting, risk scoring, and the management of their standing bonds.
*   **`ZetaOrderBook.sol`**: The core contract for creating and managing logistics orders. Users create orders, and agents can commit to and reveal quotes for these orders.
*   **`ZetaVault.sol`**: Acts as the treasury and escrow for the platform. It holds the funds for orders, manages the standing bonds for agents, and handles the distribution of payments upon order completion.
*   **`ZetaDisputes.sol`**: Manages the dispute resolution process. If a user is unsatisfied with an order, they can open a claim, and this contract resolves the dispute.

## Tech Stack

*   **Framework**: React 18 + TypeScript.
*   **Router**: React Router.
*   **State**: TanStack Query for server/indexer reads; Zustand for UI/session state.
*   **Wallet**: WalletConnect v2 + HashConnect for HashPack and Blade.
*   **Session auth**: WebAuthn via SimpleWebAuthn browser package.
*   **Transport**: GraphQL for indexer reads; REST for small helper endpoints.
*   **Styling**: Tailwind CSS.

## Environment variables (.env)

The following environment variables are required for the frontend application:

```
VITE_APP_NAME=Zeta
VITE_ORIGIN=https://app.zeta.global
VITE_RP_ID=app.zeta.global

VITE_HEDERA_NETWORK=testnet
VITE_RPC_URL=https://testnet.hashio.io/api
VITE_MIRROR_URL=https://testnet.mirrornode.hedera.com
VITE_HCS_TOPIC_ID=0.0.123456

VITE_CONTRACT_POLICY=0x0000000000000000000000000000000000000001
VITE_CONTRACT_AGENTS=0x0000000000000000000000000000000000000002
VITE_CONTRACT_ORDERBOOK=0x0000000000000000000000000000000000000003
VITE_CONTRACT_VAULT=0x0000000000000000000000000000000000000004
VITE_CONTRACT_DISPUTES=0x0000000000000000000000000000000000000005

VITE_ALLOWED_TOKEN=HBAR
VITE_TREASURY_BPS=1000
VITE_DEFAULT_HOLDBACK_BPS=500
VITE_DEFAULT_MICROBOND_BPS=500
VITE_CLAIM_WINDOW_HOURS=72
VITE_ACK_WINDOW_HOURS=2
```
