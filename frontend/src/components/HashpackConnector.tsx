import { memo } from "react";
import { useHashConnect } from "../hooks/useHashConnect";

export const HashpackConnector = memo(() => {
  const { connected, accountId, connect, disconnect, pairingData } = useHashConnect();

  return (
    <div className="card wallet-card">
      <div className="wallet-copy">
        <h2>Wallet</h2>
        {connected ? <div className="wallet-account">{accountId}</div> : <p>Connect HashPack to start working with Zeta.</p>}
        {pairingData?.walletMetadata && (
          <p className="wallet-meta">Connected via {pairingData.walletMetadata.name}</p>
        )}
      </div>
      <div className="wallet-actions">
        {connected ? (
          <button onClick={disconnect} className="btn ghost">
            Disconnect
          </button>
        ) : (
          <button onClick={connect} className="btn primary">
            Connect HashPack
          </button>
        )}
      </div>
    </div>
  );
});
