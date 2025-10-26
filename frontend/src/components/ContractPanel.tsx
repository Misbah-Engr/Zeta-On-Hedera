import { useEffect, useMemo, useState } from "react";
import { Contract, JsonRpcProvider, JsonRpcSigner } from "ethers";
import { ContractConfig } from "../lib/contracts";
import { FunctionForm } from "./FunctionForm";

interface ContractPanelProps {
  config: ContractConfig;
  readProvider: JsonRpcProvider;
  signer?: JsonRpcSigner;
  connected: boolean;
}

export function ContractPanel({ config, readProvider, signer, connected }: ContractPanelProps) {
  const [roleFlags, setRoleFlags] = useState<Record<string, boolean>>({});

  const readContract = useMemo(() => {
    if (!config.address) return null;
    return new Contract(config.address, config.abi, readProvider);
  }, [config.address, config.abi, readProvider]);

  const writeContract = useMemo(() => {
    if (!config.address || !signer) return undefined;
    return new Contract(config.address, config.abi, signer);
  }, [config.address, config.abi, signer]);

  useEffect(() => {
    if (!config.roles || !connected || !signer || !readContract) {
      setRoleFlags({});
      return;
    }
    let cancelled = false;
    (async () => {
      const address = await signer.getAddress();
      const entries = await Promise.all(
        config.roles.map(async (role) => {
          try {
            const has = await (readContract as any).hasRole(role.id, address);
            return [role.id, Boolean(has)] as const;
          } catch (err) {
            console.error(err);
            return [role.id, false] as const;
          }
        })
      );
      if (!cancelled) {
        setRoleFlags(Object.fromEntries(entries));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [config.roles, connected, signer, readContract]);

  const functions = useMemo(() => {
    return (config.abi as any[]).filter((item) => item.type === "function");
  }, [config.abi]);

  const reads = functions.filter((fn) => fn.stateMutability === "view" || fn.stateMutability === "pure");
  const writes = functions.filter((fn) => fn.stateMutability !== "view" && fn.stateMutability !== "pure");

  return (
    <section className="card contract-card">
      <header className="contract-header">
        <div className="contract-title-row">
          <h3>{config.name}</h3>
          {config.address ? <code>{config.address}</code> : <span className="warning">Set {config.name} address in env</span>}
        </div>
        {config.description && <p>{config.description}</p>}
        {config.roles && config.roles.length > 0 && (
          <div className="role-badges">
            {config.roles.map((role) => (
              <span key={role.id} className={roleFlags[role.id] ? "badge active" : "badge"}>
                {role.label}
              </span>
            ))}
          </div>
        )}
      </header>
      {readContract ? (
        <div className="function-grid">
          {reads.map((fn) => (
            <FunctionForm key={fn.name + fn.inputs?.length} func={fn} contract={readContract} isWrite={false} />
          ))}
        </div>
      ) : (
        <p className="muted">Provide a contract address to interact.</p>
      )}
      {readContract && writes.length > 0 && (
        <div className="write-section">
          <h4>Write</h4>
          <div className="function-grid">
            {writes.map((fn) => (
              <FunctionForm
                key={fn.name + fn.inputs?.length}
                func={fn}
                contract={readContract!}
                writeContract={writeContract}
                isWrite
                disabled={!connected || !writeContract}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
