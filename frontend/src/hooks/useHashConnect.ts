import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { BrowserProvider, JsonRpcSigner } from "ethers";
import type { HashConnect, HashConnectTypes } from "hashconnect";
import { HashConnect as HashConnectCtor } from "hashconnect";

interface HashConnectContextValue {
  accountId?: string;
  topic?: string;
  pairingData?: HashConnectTypes.SavedPairingData;
  provider?: BrowserProvider;
  signer?: JsonRpcSigner;
  connected: boolean;
  connect(): void;
  disconnect(): void;
  hashconnect?: HashConnect;
}

const HashConnectContext = createContext<HashConnectContextValue | undefined>(undefined);

const network = (import.meta.env.VITE_HEDERA_NETWORK || "testnet") as HashConnectTypes.NetworkName;

export function HashConnectProvider({ children }: PropsWithChildren) {
  const [hashconnect, setHashconnect] = useState<HashConnect>();
  const [topic, setTopic] = useState<string>();
  const [pairingData, setPairingData] = useState<HashConnectTypes.SavedPairingData>();
  const [accountId, setAccountId] = useState<string>();
  const [provider, setProvider] = useState<BrowserProvider>();
  const [signer, setSigner] = useState<JsonRpcSigner>();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hc = new HashConnectCtor();
    setHashconnect(hc);
    let cancelled = false;

    const handlePairing = async (pairing: HashConnectTypes.SavedPairingData) => {
      setPairingData(pairing);
      const account = pairing.accountIds[0];
      setAccountId(account);
      const provider = hc.getProvider(network, pairing.topic, account) as any;
      if (provider && typeof provider.connect === "function") {
        try {
          await provider.connect(account);
        } catch (err) {
          console.error("HashConnect provider connect failed", err);
        }
      }
      const browserProvider = new BrowserProvider(provider);
      setProvider(browserProvider);
      browserProvider.getSigner().then(setSigner).catch(console.error);
    };

    const appMetadata: HashConnectTypes.AppMetadata = {
      name: import.meta.env.VITE_APP_NAME || "Zeta",
      description: "Zeta logistics control",
      icon: `${window.location.origin}/zeta.svg`
    };

    (async () => {
      const init = await hc.init(appMetadata, network, true);
      if (cancelled) return;
      setTopic(init.topic);
      if (init.savedPairings.length > 0) {
        handlePairing(init.savedPairings[0]).catch(console.error);
      }
    })();

    const listener = (pairing: HashConnectTypes.SavedPairingData) => {
      handlePairing(pairing).catch(console.error);
    };

    hc.pairingEvent.on(listener);

    return () => {
      cancelled = true;
      hc.pairingEvent.off(listener);
      if ((hc as any).disconnect) {
        (hc as any).disconnect();
      }
    };
  }, []);

  const connect = useCallback(() => {
    if (!hashconnect) return;
    hashconnect.connectToLocalWallet();
  }, [hashconnect]);

  const disconnect = useCallback(() => {
    if (!hashconnect) return;
    if ((hashconnect as any).clearConnectionsAndData) {
      (hashconnect as any).clearConnectionsAndData();
    }
    setPairingData(undefined);
    setAccountId(undefined);
    setProvider(undefined);
    setSigner(undefined);
  }, [hashconnect]);

  const value = useMemo<HashConnectContextValue>(
    () => ({
      accountId,
      topic,
      pairingData,
      provider,
      signer,
      connect,
      disconnect,
      connected: Boolean(provider && accountId),
      hashconnect
    }),
    [accountId, topic, pairingData, provider, signer, connect, disconnect, hashconnect]
  );

  return <HashConnectContext.Provider value={value}>{children}</HashConnectContext.Provider>;
}

export function useHashConnect() {
  const ctx = useContext(HashConnectContext);
  if (!ctx) {
    throw new Error("useHashConnect must be used within HashConnectProvider");
  }
  return ctx;
}
