# Zeta

One year ago, I was selling laptops to my 12k Facebook followers, and I discovered one annoying problem Nigerian Small businesses battle with everyday.

Here are 2 ways we ship goods to buyers:
1. We agree with the buyer to pay delivery fees
2. We go to a motor park and get a driver that goes to the buyer's city that day
3. We link them by giving the driver the buyer's phone number and they call
4. Buyer comes and collect their goods when the driver arrives.
Before they arrive they would have called to notify.

OR

1. We agree to pay the delivery fee, so, customer only receives the purchased goods
2. We pay the driver and give them the goods
3. Driver calls the buyer
4. Buyer collects goods when driver arrives.

Unfortunately, some unscrupulous drivers damage the system with dishonesty.

1. They might collect delivery fee from both seller and buyer, and buyer is forced to pay since the goods have already arrived.
2. Some drivers drop goods at a shop near bus stop and call the buyer later to say they called and did not reach them due to network issues.
3. When the buyer comes to the shop, they are forced to pay more as 'storing fees', which they claim is for the shop owner.

I faced this and was angry. I saw a lot of businesses talking about this across Nigerian e-commerce community.
Zeta is a minimal, explicit, and executable onchain logistics escrow platform built on the Hedera EVM. This repository contains the core smart contracts for the Zeta protocol.

Not just in Nigeria,
People want to send stuff across cities and countries; the folks who actually move it get paid on whatever rail is local (cash, bank transfer, M-Pesa, PIX, ACH, Opay), and none of that plugs cleanly into a global, trustable pay when delivered flow. Marketplaces solve it by becoming banks and cops: they hold your money, harvest your data, over-KYC everyone, and still make you wait days when something goes wrong. Crypto solves settlement of money but ignore the hard part: proving a delivery happened and handling disputes without doxxing everyone. Escrow services exist, but they’re bank-centric, slow, and not portable across borders.

That’s the problem Zeta is built for, there is no neutral, verifiable, cross-border escrow for physical delivery that lets 

(a) a sender lock funds now, 
(b) a local payout agent front the driver/deliverer off-chain on their own rail and set an all-in fee, and 
(c) everyone resolve it arrived vs it didn’t with tamper-evident proofs instead of emails

Jobs to be done:

Sender: pay once, see the fee up front, get money released only on proof, and have a short, predictable dispute window.

Payout agent: publish a quote, front the driver in cash/rail they control, and get their split onchain immediately when the job closes.

Both sides: no PII dump, no opaque chargebacks, portable evidence that survives platforms.

Zeta is the thin onchain escrow and proof layer on Hedera that bridges global payers and local payout agents. Money clears on Hedera; driver pay stays off-chain; proofs are hashed; disputes slash bonds. We don’t own fleets, we don’t store bank details, and we don’t promise the impossible. We make the rules and receipts enforceable anywhere.

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
