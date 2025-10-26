import { useOutletContext } from "react-router-dom";
import { FunctionForm } from "../components/FunctionForm";
import { useContract } from "../hooks/useContract";
import { getAbiFunction } from "../lib/functions";
import type { AppViewContext } from "../types";

export function DisputesPage() {
  const context = useOutletContext<AppViewContext>();
  const { readProvider, signer, connected, access } = context;
  const disputes = useContract("ZetaDisputes", readProvider, signer);

  const needsWallet = !connected;
  const needsOperator = !(access.roles.policyAdmin || access.roles.defaultAdmin || access.roles.operator);

  return (
    <div className="page">
      <section className="section">
        <header>
          <h1>Disputes & delivery proofs</h1>
          <p>Keep Zeta honest by filing delivery proofs, opening claims, and resolving outcomes without leaving the chain.</p>
        </header>
      </section>

      <section className="section">
        <header>
          <h2>Submit evidence</h2>
          <p>Receivers and agents can push delivery proofs or claims when something doesn't line up.</p>
        </header>
        <div className="action-grid">
          <FunctionForm
            func={getAbiFunction(disputes.config, "submitPoD")}
            contract={disputes.read}
            writeContract={disputes.write}
            title="Submit proof of delivery"
            description="Attach hashed evidence that the goods arrived as promised."
            cta="Submit proof"
            disabled={needsWallet}
            disabledReason={needsWallet ? "Connect HashPack to share proofs." : undefined}
          />
          <FunctionForm
            func={getAbiFunction(disputes.config, "openClaim")}
            contract={disputes.read}
            writeContract={disputes.write}
            title="Open a claim"
            description="Escalate an order with hashed evidence when the delivery failed."
            cta="Open claim"
            disabled={needsWallet}
            disabledReason={needsWallet ? "Connect HashPack to open a claim." : undefined}
          />
        </div>
      </section>

      <section className="section">
        <header>
          <h2>Track dispute progress</h2>
          <p>Follow the state of each order to know what's pending, settled, or escalated.</p>
        </header>
        <div className="action-grid">
          <FunctionForm
            func={getAbiFunction(disputes.config, "disputeState")}
            contract={disputes.read}
            title="Dispute state"
            description="Check the current dispute status code for an order."
            cta="Check state"
          />
          <FunctionForm
            func={getAbiFunction(disputes.config, "orderPods")}
            contract={disputes.read}
            title="Submitted proofs"
            description="Browse stored proof hashes tied to an order."
            cta="View proofs"
          />
          <FunctionForm
            func={getAbiFunction(disputes.config, "userClaims")}
            contract={disputes.read}
            title="Active claims"
            description="See which claims are currently open for an order."
            cta="View claims"
          />
        </div>
      </section>

      <section className="section">
        <header>
          <h2>Resolve outcomes</h2>
          <p>Operator and policy roles can settle disputes or update the vault linkage.</p>
        </header>
        <div className="action-grid">
          <FunctionForm
            func={getAbiFunction(disputes.config, "autoResolve")}
            contract={disputes.read}
            writeContract={disputes.write}
            title="Auto-resolve"
            description="Finalize a dispute automatically when deadlines are met."
            cta="Resolve"
            disabled={needsOperator}
            disabledReason={needsOperator ? "Requires operator or admin role." : undefined}
          />
          <FunctionForm
            func={getAbiFunction(disputes.config, "setVaultContract")}
            contract={disputes.read}
            writeContract={disputes.write}
            title="Update vault linkage"
            description="Point the dispute engine to a new vault implementation."
            cta="Update"
            disabled={needsOperator}
            disabledReason={needsOperator ? "Requires operator or admin role." : undefined}
          />
        </div>
      </section>
    </div>
  );
}
