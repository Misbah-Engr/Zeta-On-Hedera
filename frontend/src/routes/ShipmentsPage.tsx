import { useOutletContext } from "react-router-dom";
import { FunctionForm } from "../components/FunctionForm";
import { useContract } from "../hooks/useContract";
import { getAbiFunction } from "../lib/functions";
import type { AppViewContext } from "../types";

export function ShipmentsPage() {
  const context = useOutletContext<AppViewContext>();
  const { readProvider, signer, connected, access } = context;
  const orderbook = useContract("ZetaOrderBook", readProvider, signer);
  const vault = useContract("ZetaVault", readProvider, signer);

  const restricted = !connected;

  return (
    <div className="page">
      <section className="section">
        <header>
          <h1>Send & track deliveries</h1>
          <p>
            Create a shipment intent, invite agents to quote, fund escrow, and follow progress through completion. Everything is
            grouped the way senders expect.
          </p>
        </header>
        {access.userBanned && (
          <p className="warning">Your address is currently suspended from booking deliveries.</p>
        )}
      </section>

      <section className="section">
        <header>
          <h2>Plan a new delivery</h2>
          <p>Describe the job and lock in funds so agents can compete to fulfill it.</p>
        </header>
        <div className="action-grid">
          <FunctionForm
            func={getAbiFunction(orderbook.config, "createOrderIntent")}
            contract={orderbook.read}
            writeContract={orderbook.write}
            title="Publish order intent"
            description="Define where the item is going, what it is, and the most you're willing to pay."
            cta="Create order"
            disabled={restricted}
            disabledReason={restricted ? "Connect HashPack to create a delivery." : undefined}
          />
          <FunctionForm
            func={getAbiFunction(orderbook.config, "userFund")}
            contract={orderbook.read}
            writeContract={orderbook.write}
            title="Fund escrow"
            description="Deposit the total cost of the delivery (including agent fees)."
            cta="Fund order"
            disabled={restricted}
            disabledReason={restricted ? "Connect HashPack to fund escrow." : undefined}
          />
          <FunctionForm
            func={getAbiFunction(orderbook.config, "cancel")}
            contract={orderbook.read}
            writeContract={orderbook.write}
            title="Cancel an order"
            description="Withdraw an order before an agent has been locked in."
            cta="Cancel order"
            disabled={restricted}
            disabledReason={restricted ? "Connect HashPack to manage orders." : undefined}
          />
        </div>
      </section>

      <section className="section">
        <header>
          <h2>Monitor quotes & selection</h2>
          <p>Check who has quoted, reveal commitments, and finalize the agent you're working with.</p>
        </header>
        <div className="action-grid">
          <FunctionForm
            func={getAbiFunction(orderbook.config, "orders")}
            contract={orderbook.read}
            title="Check order details"
            description="Look up the current state of an order by its ID."
            cta="Fetch order"
          />
          <FunctionForm
            func={getAbiFunction(orderbook.config, "commits")}
            contract={orderbook.read}
            title="View quote commitments"
            description="Review hashed quotes submitted by agents before reveal."
            cta="Inspect commits"
          />
          <FunctionForm
            func={getAbiFunction(orderbook.config, "revealQuote")}
            contract={orderbook.read}
            writeContract={orderbook.write}
            title="Reveal my quote"
            description="Agents reveal their terms to be eligible for selection."
            cta="Reveal quote"
            disabled={!access.isAgent}
            disabledReason={!access.isAgent ? "Only listed agents can reveal quotes." : undefined}
          />
          <FunctionForm
            func={getAbiFunction(orderbook.config, "autoSelect")}
            contract={orderbook.read}
            writeContract={orderbook.write}
            title="Auto-select best quote"
            description="Let the protocol pick the best available quote based on weights."
            cta="Select agent"
            disabled={restricted}
            disabledReason={restricted ? "Connect HashPack to manage selections." : undefined}
          />
          <FunctionForm
            func={getAbiFunction(orderbook.config, "ackSelect")}
            contract={orderbook.read}
            writeContract={orderbook.write}
            title="Confirm my agent"
            description="Acknowledge and lock in the agent who will fulfill this delivery."
            cta="Confirm agent"
            disabled={restricted}
            disabledReason={restricted ? "Connect HashPack to manage selections." : undefined}
          />
          <FunctionForm
            func={getAbiFunction(orderbook.config, "selectedAgent")}
            contract={orderbook.read}
            title="See selected agent"
            description="Check which agent is currently assigned to an order."
            cta="Check agent"
          />
        </div>
      </section>

      <section className="section">
        <header>
          <h2>Finish the delivery</h2>
          <p>Confirm completion, release holdbacks, or escalate when things go wrong.</p>
        </header>
        <div className="action-grid">
          <FunctionForm
            func={getAbiFunction(orderbook.config, "markCompleted")}
            contract={orderbook.read}
            writeContract={orderbook.write}
            title="Mark order completed"
            description="Signal that the goods arrived and the dispute timer can start."
            cta="Mark completed"
            disabled={restricted}
            disabledReason={restricted ? "Connect HashPack to update deliveries." : undefined}
          />
          <FunctionForm
            func={getAbiFunction(vault.config, "orderLocks")}
            contract={vault.read}
            title="Inspect escrow balances"
            description="See how much is held for user, agent, and treasury for an order."
            cta="Inspect escrow"
          />
          <FunctionForm
            func={getAbiFunction(vault.config, "releaseHoldback")}
            contract={vault.read}
            writeContract={vault.write}
            title="Release holdback"
            description="Unlock the remaining funds after a successful delivery."
            cta="Release"
            disabled={restricted}
            disabledReason={restricted ? "Connect HashPack to release funds." : undefined}
          />
        </div>
      </section>
    </div>
  );
}
