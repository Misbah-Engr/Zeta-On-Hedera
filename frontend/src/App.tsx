import { useMemo } from "react";
import { JsonRpcProvider } from "ethers";
import { HashpackConnector } from "./components/HashpackConnector";
import { ContractPanel } from "./components/ContractPanel";
import { CONTRACTS, RPC_URL } from "./lib/contracts";
import { HashConnectProvider, useHashConnect } from "./hooks/useHashConnect";

function AppShell() {
  const rpcProvider = useMemo(() => new JsonRpcProvider(RPC_URL), []);
  const { connected, signer } = useHashConnect();

  return (
    <main className="app-shell">
      <header className="app-hero">
        <div className="app-hero-copy">
          <h1>Zeta Control Center</h1>
          <p>
            Operate Zeta's logistics escrow on Hedera. Connect with HashPack, review state, and execute writes when your account
            carries the right roles.
          </p>
        </div>
        <HashpackConnector />
      </header>
      <section className="panel-grid">
        {CONTRACTS.map((config) => (
          <ContractPanel key={config.name} config={config} readProvider={rpcProvider} signer={signer} connected={connected} />
        ))}
      </section>
    </main>
  );
}

export default function App() {
  return (
    <HashConnectProvider>
      <AppShell />
    </HashConnectProvider>
  );
}
