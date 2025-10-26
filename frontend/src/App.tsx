import { useMemo } from "react";
import { JsonRpcProvider } from "ethers";
import { Navigate, Route, Routes } from "react-router-dom";
import { HashConnectProvider, useHashConnect } from "./hooks/useHashConnect";
import { RPC_URL } from "./lib/contracts";
import { useProtocolAccess } from "./hooks/useProtocolAccess";
import { AppLayout } from "./components/AppLayout";
import { OverviewPage } from "./routes/OverviewPage";
import { ShipmentsPage } from "./routes/ShipmentsPage";
import { AgentsPage } from "./routes/AgentsPage";
import { DisputesPage } from "./routes/DisputesPage";
import { SystemPage } from "./routes/SystemPage";
import { AppViewContext } from "./types";

function AppShell() {
  const readProvider = useMemo(() => new JsonRpcProvider(RPC_URL), []);
  const hashconnect = useHashConnect();
  const access = useProtocolAccess(readProvider, hashconnect.signer, hashconnect.connected);

  const context: AppViewContext = {
    readProvider,
    signer: hashconnect.signer,
    connected: hashconnect.connected,
    connect: hashconnect.connect,
    disconnect: hashconnect.disconnect,
    accountId: hashconnect.accountId,
    access,
    pairingData: hashconnect.pairingData
  };

  return (
    <Routes>
      <Route element={<AppLayout context={context} />}>
        <Route index element={<OverviewPage />} />
        <Route path="shipments" element={<ShipmentsPage />} />
        <Route path="agents" element={<AgentsPage />} />
        <Route path="disputes" element={<DisputesPage />} />
        <Route path="system" element={<SystemPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <HashConnectProvider>
      <AppShell />
    </HashConnectProvider>
  );
}
