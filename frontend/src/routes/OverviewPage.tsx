import { Link, useOutletContext } from "react-router-dom";
import { FunctionForm } from "../components/FunctionForm";
import { useContract } from "../hooks/useContract";
import { getAbiFunction } from "../lib/functions";
import type { AppViewContext } from "../types";

export function OverviewPage() {
  const context = useOutletContext<AppViewContext>();
  const { readProvider, signer, connected, access } = context;
  const policy = useContract("ZetaPolicy", readProvider, signer);

  const policyInsights = [
    {
      key: "treasury",
      title: "Treasury destination",
      description: "Where escrow fees land after settlements.",
      cta: "Check address"
    },
    {
      key: "allowedToken",
      title: "Settlement token",
      description: "Token allowed for deliveries right now.",
      cta: "View token"
    },
    {
      key: "treasuryBps",
      title: "Treasury fee (bps)",
      description: "Protocol fee charged on every shipment.",
      cta: "Inspect fee"
    },
    {
      key: "defaultHoldbackBps",
      title: "Default holdback (bps)",
      description: "Typical holdback withheld until delivery is accepted.",
      cta: "Check holdback"
    },
    {
      key: "defaultMicrobondBps",
      title: "Default microbond (bps)",
      description: "Bond agents must front while handling an order.",
      cta: "Check bond"
    },
    {
      key: "claimWindowSec",
      title: "Claim window (seconds)",
      description: "How long receivers can challenge a delivery.",
      cta: "View window"
    },
    {
      key: "acceptAckWindowSec",
      title: "Acknowledgement window (seconds)",
      description: "Time agents have to confirm selection.",
      cta: "View window"
    },
    {
      key: "paused",
      title: "Is the network paused?",
      description: "Check whether new orders can be created.",
      cta: "Check status"
    }
  ];

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-copy">
          <h1>Logistics without the guesswork</h1>
          <p>
            Zeta lets senders, payout agents, and buyers clear deliveries with Hedera security. Connect your HashPack wallet to
            book a shipment, apply as an agent, or keep disputes transparent.
          </p>
          <div className="hero-actions">
            <Link className="btn primary" to="/shipments">
              Plan a delivery
            </Link>
            <Link className="btn secondary" to="/agents">
              Work as an agent
            </Link>
          </div>
        </div>
        <div className="hero-status">
          <div className="status-card">
            <span className="status-label">Wallet</span>
            <strong>{connected ? context.accountId : "Not connected"}</strong>
            {access.address && <small>Hedera mirror: {access.address}</small>}
          </div>
          <div className="status-card">
            <span className="status-label">Roles</span>
            <ul>
              <li className={access.roles.defaultAdmin ? "yes" : "no"}>Default admin</li>
              <li className={access.roles.policyAdmin ? "yes" : "no"}>Policy admin</li>
              <li className={access.roles.operator ? "yes" : "no"}>Operator</li>
              <li className={access.roles.listing ? "yes" : "no"}>Listing</li>
            </ul>
          </div>
          <div className="status-card">
            <span className="status-label">Agent status</span>
            <strong>{access.isAgent ? "Whitelisted" : "Not listed"}</strong>
            {access.agentBanned && <small className="warning">Currently blocked from working as an agent.</small>}
          </div>
        </div>
      </section>

      <section className="section">
        <header>
          <h2>Protocol snapshot</h2>
          <p>Peek at the live settings that shape fees, claims, and scheduling.</p>
        </header>
        <div className="action-grid">
          {policyInsights.map((insight) => (
            <FunctionForm
              key={insight.key}
              func={getAbiFunction(policy.config, insight.key)}
              contract={policy.read}
              title={insight.title}
              description={insight.description}
              cta={insight.cta}
            />
          ))}
        </div>
      </section>

      <section className="section">
        <header>
          <h2>Where to go next</h2>
          <p>Pick the workflow that matches what you're trying to get done.</p>
        </header>
        <div className="flow-cards">
          <Link to="/shipments" className="flow-card">
            <h3>Send or track goods</h3>
            <p>Create an intent, fund escrow, and follow status changes end-to-end.</p>
          </Link>
          <Link to="/agents" className="flow-card">
            <h3>Operate as a payout agent</h3>
            <p>Post quotes, manage risk scores, and keep your standing bond topped up.</p>
          </Link>
          <Link to="/disputes" className="flow-card">
            <h3>Resolve a dispute</h3>
            <p>Submit delivery proofs, escalate issues, or finalize claims with evidence.</p>
          </Link>
          {(access.roles.policyAdmin || access.roles.defaultAdmin) && (
            <Link to="/system" className="flow-card">
              <h3>Administer the network</h3>
              <p>Adjust parameters, pause components, and review every contract function.</p>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
