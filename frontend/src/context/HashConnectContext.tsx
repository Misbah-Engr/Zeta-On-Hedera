import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import HashConnect, { HashConnectConnectionState, HashConnectTypes } from 'hashconnect';

interface HashConnectContextValue {
  connect: () => Promise<void>;
  disconnect: () => void;
  pairingData?: HashConnectTypes.SavedPairingData;
  accountId?: string;
  topic?: string;
  isConnected: boolean;
  walletState: string;
  hashconnect?: HashConnect;
  hashpackAvailable: boolean;
}

const APP_METADATA: HashConnectTypes.AppMetadata = {
  name: 'Zeta Logistics Marketplace',
  description: 'Onchain P2P fulfilment marketplace on Hedera',
  icon: 'https://www.binance.com/resources/img/logo-crypto.png'
};

const PROJECT_ID = '875715c9db8209ba690a58e170657737';

const HashConnectContext = createContext<HashConnectContextValue | undefined>(undefined);

export const HashConnectProvider = ({ children }: PropsWithChildren) => {
  const hashconnectRef = useRef<HashConnect>();
  const [pairingData, setPairingData] = useState<HashConnectTypes.SavedPairingData>();
  const [topic, setTopic] = useState<string>();
  const [walletState, setWalletState] = useState<HashConnectConnectionState>(
    HashConnectConnectionState.Disconnected
  );
  const [hashpackAvailable, setHashpackAvailable] = useState(false);

  useEffect(() => {
    const hashconnect = new HashConnect(true);
    hashconnectRef.current = hashconnect;
    let mounted = true;

    const init = async () => {
      try {
        const initData = await hashconnect.init(APP_METADATA, PROJECT_ID, true);
        if (!mounted) return;
        setTopic(initData.topic);
        setWalletState(hashconnect.hcData?.state ?? HashConnectConnectionState.Disconnected);
        if (initData.pairingData?.length) {
          setPairingData(initData.pairingData[0]);
          setHashpackAvailable(true);
        }
        hashconnect.findLocalWallets();
      } catch (error) {
        console.error('Failed to initialise HashConnect', error);
      }
    };

    const foundListener = hashconnect.foundExtensionEvent.on((walletMetadata) => {
      if (!mounted) return;
      setHashpackAvailable(walletMetadata.some((wallet) => wallet.name.toLowerCase().includes('hashpack')));
    });

    const pairingListener = hashconnect.pairingEvent.on((newPairing) => {
      if (!mounted) return;
      setPairingData(newPairing);
    });

    const stateListener = hashconnect.connectionStatusChangeEvent.on((state) => {
      if (!mounted) return;
      setWalletState(state);
    });

    init();

    return () => {
      mounted = false;
      foundListener();
      pairingListener();
      stateListener();
      hashconnectRef.current?.clearConnections();
    };
  }, []);

  const connect = useCallback(async () => {
    const hashconnect = hashconnectRef.current;
    if (!hashconnect) return;
    if (walletState === HashConnectConnectionState.Connecting) return;
    if (!hashpackAvailable) {
      hashconnect.findLocalWallets();
    }
    if (topic) {
      await hashconnect.connectToLocalWallet();
    } else {
      const initData = await hashconnect.init(APP_METADATA, PROJECT_ID, true);
      setTopic(initData.topic);
      await hashconnect.connectToLocalWallet();
    }
  }, [hashpackAvailable, topic, walletState]);

  const disconnect = useCallback(() => {
    const hashconnect = hashconnectRef.current;
    if (!hashconnect || !pairingData) return;
    try {
      hashconnect.disconnect(pairingData.topic);
    } catch (error) {
      console.error('Failed to disconnect', error);
    } finally {
      setPairingData(undefined);
      setWalletState(HashConnectConnectionState.Disconnected);
    }
  }, [pairingData]);

  const walletStateLabel = useMemo(() => {
    switch (walletState) {
      case HashConnectConnectionState.Connected:
        return 'Connected';
      case HashConnectConnectionState.Connecting:
        return 'Connecting';
      case HashConnectConnectionState.Disconnecting:
        return 'Disconnecting';
      default:
        return 'Disconnected';
    }
  }, [walletState]);

  const value = useMemo<HashConnectContextValue>(
    () => ({
      connect,
      disconnect,
      pairingData,
      accountId: pairingData?.accountIds?.[0],
      topic,
      isConnected: !!pairingData?.accountIds?.length,
      walletState: walletStateLabel,
      hashconnect: hashconnectRef.current,
      hashpackAvailable
    }),
    [connect, disconnect, pairingData, topic, walletStateLabel, hashpackAvailable]
  );

  return <HashConnectContext.Provider value={value}>{children}</HashConnectContext.Provider>;
};

export const useHashConnectContext = () => {
  const context = useContext(HashConnectContext);
  if (!context) {
    throw new Error('useHashConnectContext must be used within HashConnectProvider');
  }
  return context;
};


