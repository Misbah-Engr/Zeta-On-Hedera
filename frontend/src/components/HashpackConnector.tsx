import { memo } from "react";
import { useHashConnect } from "../hooks/useHashConnect";

export const HashpackConnector = memo(() => {
  const { connected, accountId, connect, disconnect, pairingData } = useHashConnect();

  if (connected) {
    return (
      <div className="wallet-chip connected">
        <div className="wallet-details">
          <span className="wallet-label">Wallet</span>
          <strong>{accountId}</strong>
          {pairingData?.walletMetadata?.name && <span>via {pairingData.walletMetadata.name}</span>}
        </div>
        <button className="btn link" onClick={disconnect} type="button">
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button className="wallet-chip" onClick={connect} type="button">
      <span className="wallet-label">Wallet</span>
      <strong>Connect HashPack</strong>
    </button>
  );
});
