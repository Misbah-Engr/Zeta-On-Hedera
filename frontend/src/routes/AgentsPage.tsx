import { useOutletContext } from "react-router-dom";
import { FunctionForm } from "../components/FunctionForm";
import { useContract } from "../hooks/useContract";
import { getAbiFunction } from "../lib/functions";
import type { AppViewContext } from "../types";

export function AgentsPage() {
  const context = useOutletContext<AppViewContext>();
  const { readProvider, signer, connected, access } = context;
  const agents = useContract("ZetaAgents", readProvider, signer);
  const orderbook = useContract("ZetaOrderBook", readProvider, signer);
  const vault = useContract("ZetaVault", readProvider, signer);

  const needsWallet = !connected;
  const needsAgent = !access.isAgent;
  const needsListingAdmin = !(access.roles.listing || access.roles.policyAdmin || access.roles.defaultAdmin);

  return (
    <div className="page">
      <section className="section">
        <header>
          <h1>Agent workspace</h1>
          <p>Keep your bond topped up, publish quotes, and stay compliant with Zeta's requirements.</p>
        </header>
        {needsAgent && (
          <p className="info">
            Not listed yet? Reach out to a policy admin with your payout details so they can whitelist your address.
          </p>
        )}
      </section>

      <section className="section">
        <header>
          <h2>Your standing</h2>
          <p>Check whether you're listed, what risk score you carry, and how much bond you've deposited.</p>
        </header>
        <div className="action-grid">
          <FunctionForm
            func={getAbiFunction(agents.config, "isWhitelisted")}
            contract={agents.read}
            title="Check listing"
            description="Confirm whether an address is able to act as a Zeta agent."
            cta="Check status"
          />
          <FunctionForm
            func={getAbiFunction(agents.config, "agents")}
            contract={agents.read}
            title="View listing details"
            description="See whitelist status, risk score, and fee anchor stored for an agent."
            cta="View listing"
          />
          <FunctionForm
            func={getAbiFunction(agents.config, "riskScore")}
            contract={agents.read}
            title="Risk score"
            description="Retrieve the current risk score assigned to an agent."
            cta="Check risk"
          />
          <FunctionForm
            func={getAbiFunction(agents.config, "bondDeposit")}
            contract={agents.read}
            writeContract={agents.write}
            title="Deposit standing bond"
            description="Add funds to your bond so you can take on more deliveries."
            cta="Deposit"
            disabled={needsWallet}
            disabledReason={needsWallet ? "Connect HashPack to deposit." : undefined}
          />
          <FunctionForm
            func={getAbiFunction(agents.config, "bondWithdraw")}
            contract={agents.read}
            writeContract={agents.write}
            title="Withdraw standing bond"
            description="Pull back unused bond when you need to reduce exposure."
            cta="Withdraw"
            disabled={needsWallet}
            disabledReason={needsWallet ? "Connect HashPack to withdraw." : undefined}
          />
          <FunctionForm
            func={getAbiFunction(vault.config, "standingBond")}
            contract={vault.read}
            title="Bond balance"
            description="View how much bond an agent has locked right now."
            cta="Check bond"
          />
        </div>
      </section>

      <section className="section">
        <header>
          <h2>Quote and execute</h2>
          <p>Use these actions during the quoting and fulfillment lifecycle.</p>
        </header>
        <div className="action-grid">
          <FunctionForm
            func={getAbiFunction(orderbook.config, "commitQuote")}
            contract={orderbook.read}
            writeContract={orderbook.write}
            title="Commit a quote"
            description="Hash your quote parameters to signal interest in an order."
            cta="Commit"
            disabled={needsWallet || needsAgent}
            disabledReason={needsAgent ? "Only listed agents can commit quotes." : needsWallet ? "Connect HashPack to continue." : undefined}
          />
          <FunctionForm
            func={getAbiFunction(orderbook.config, "revealQuote")}
            contract={orderbook.read}
            writeContract={orderbook.write}
            title="Reveal quote"
            description="Share your full quote terms so the user can select you."
            cta="Reveal"
            disabled={needsWallet || needsAgent}
            disabledReason={needsAgent ? "Only listed agents can reveal quotes." : needsWallet ? "Connect HashPack to continue." : undefined}
          />
          <FunctionForm
            func={getAbiFunction(orderbook.config, "candidateAgents")}
            contract={orderbook.read}
            title="List candidate agents"
            description="See which agents are in the running for an order."
            cta="View candidates"
          />
          <FunctionForm
            func={getAbiFunction(orderbook.config, "selectedAgent")}
            contract={orderbook.read}
            title="Who was picked?"
            description="Check which agent was accepted for an order."
            cta="View agent"
          />
        </div>
      </section>

      <section className="section">
        <header>
          <h2>Listing admin</h2>
          <p>Only available to addresses with the listing or policy admin role.</p>
        </header>
        <div className="action-grid">
          <FunctionForm
            func={getAbiFunction(agents.config, "whitelist")}
            contract={agents.read}
            writeContract={agents.write}
            title="Whitelist agent"
            description="Approve a new agent to operate on Zeta."
            cta="Whitelist"
            disabled={needsListingAdmin}
            disabledReason={needsListingAdmin ? "Requires listing or policy admin role." : undefined}
          />
          <FunctionForm
            func={getAbiFunction(agents.config, "unlist")}
            contract={agents.read}
            writeContract={agents.write}
            title="Remove agent"
            description="Revoke an agent's ability to take on deliveries."
            cta="Unlist"
            disabled={needsListingAdmin}
            disabledReason={needsListingAdmin ? "Requires listing or policy admin role." : undefined}
          />
          <FunctionForm
            func={getAbiFunction(agents.config, "setRisk")}
            contract={agents.read}
            writeContract={agents.write}
            title="Set risk score"
            description="Adjust an agent's risk score in basis points."
            cta="Update risk"
            disabled={needsListingAdmin}
            disabledReason={needsListingAdmin ? "Requires listing or policy admin role." : undefined}
          />
          <FunctionForm
            func={getAbiFunction(agents.config, "setFeeAnchor")}
            contract={agents.read}
            writeContract={agents.write}
            title="Update fee anchor"
            description="Set the content ID describing this agent's fee schedule."
            cta="Update anchor"
            disabled={needsListingAdmin}
            disabledReason={needsListingAdmin ? "Requires listing or policy admin role." : undefined}
          />
        </div>
      </section>
    </div>
  );
}
