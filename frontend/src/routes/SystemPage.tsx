import { useMemo } from "react";
import { AbiFunction } from "ethers";
import { useOutletContext } from "react-router-dom";
import { FunctionForm } from "../components/FunctionForm";
import { useContract } from "../hooks/useContract";
import type { AppViewContext } from "../types";

export function SystemPage() {
  const context = useOutletContext<AppViewContext>();
  const { readProvider, signer, connected, access } = context;

  const policy = useContract("ZetaPolicy", readProvider, signer);
  const agents = useContract("ZetaAgents", readProvider, signer);
  const orderbook = useContract("ZetaOrderBook", readProvider, signer);
  const vault = useContract("ZetaVault", readProvider, signer);
  const disputes = useContract("ZetaDisputes", readProvider, signer);

  const contracts = useMemo(
    () => [
      { instance: policy, label: "Policy", copy: "Govern network parameters, treasury routing, and role assignments." },
      { instance: agents, label: "Agents", copy: "Manage whitelisting, risk, and fee anchors for payout agents." },
      { instance: orderbook, label: "Order book", copy: "Control the lifecycle of shipments, from intent to selection." },
      { instance: vault, label: "Vault", copy: "Handle escrow balances, standing bonds, and settlements." },
      { instance: disputes, label: "Disputes", copy: "Coordinate proofs of delivery and claim resolution." }
    ],
    [policy, agents, orderbook, vault, disputes]
  );

  const adminMissing = !(access.roles.policyAdmin || access.roles.defaultAdmin || access.roles.operator || access.roles.listing);

  const walletWarning = !connected ? "Connect HashPack to run contract actions." : undefined;

  return (
    <div className="page">
      <section className="section">
        <header>
          <h1>System controls</h1>
          <p>
            Everything power users need to maintain Zeta's contracts. Actions are grouped by contract and keep the friendly
            labels from the rest of the app.
          </p>
        </header>
        {adminMissing && <p className="warning">You do not hold an administrative role. Most writes will revert on-chain.</p>}
      </section>

      {contracts.map(({ instance, label, copy }) => {
        const config = instance.config;
        const functions = (config?.abi as any[])?.filter((item) => item.type === "function") as AbiFunction[];
        const reads = functions?.filter((fn) => fn.stateMutability === "view" || fn.stateMutability === "pure") ?? [];
        const writes = functions?.filter((fn) => !(fn.stateMutability === "view" || fn.stateMutability === "pure")) ?? [];

        return (
          <section key={config?.name ?? label} className="section contract-section">
            <header>
              <h2>{config?.description ?? `${label} contract`}</h2>
              <p>{copy}</p>
              {config?.address ? <span className="address-tag">{config.address}</span> : <span className="warning">Set this contract address in your .env to interact.</span>}
            </header>
            <div className="contract-grid">
              <div>
                <h3>Read</h3>
                <div className="action-grid">
                  {reads.map((fn) => (
                    <FunctionForm key={`${config?.name}-${fn.name}-${fn.inputs?.length ?? 0}`}
                      func={fn}
                      contract={instance.read}
                    />
                  ))}
                </div>
              </div>
              <div>
                <h3>Write</h3>
                <div className="action-grid">
                  {writes.map((fn) => (
                    <FunctionForm
                      key={`${config?.name}-${fn.name}-${fn.inputs?.length ?? 0}`}
                      func={fn}
                      contract={instance.read}
                      writeContract={instance.write}
                      disabledReason={walletWarning}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
