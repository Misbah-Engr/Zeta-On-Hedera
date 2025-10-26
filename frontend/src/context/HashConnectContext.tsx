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
import { HashConnect, HashConnectConnectionState, HashConnectTypes } from 'hashconnect';
import { LedgerId } from '@hashgraph/sdk';

interface HashConnectContextValue {
  connect: () => Promise<void>;
  disconnect: () => void;
  pairingData?: HashConnectTypes.SavedPairingData;
  pairingString?: string;
  accountId?: string;
  topic?: string;
  isConnected: boolean;
  walletState: string;
  hashconnect?: HashConnect;
}

const APP_METADATA: HashConnectTypes.AppMetadata = {
  name: 'Zeta Logistics Marketplace',
  description: 'Onchain P2P fulfilment marketplace on Hedera',
  icon: 'https://www.binance.com/resources/img/logo-crypto.png',
  url: 'https://example.com'
};

const PROJECT_ID = 'd8fae9ed380aec17a89431006c52aa53';

const HashConnectContext = createContext<HashConnectContextValue | undefined>(undefined);

export const HashConnectProvider = ({ children }: PropsWithChildren) => {
  const hashconnectRef = useRef<HashConnect>();
  const [pairingData, setPairingData] = useState<HashConnectTypes.SavedPairingData>();
  const [pairingString, setPairingString] = useState<string>();
  const [topic, setTopic] = useState<string>();
  const [walletState, setWalletState] = useState<HashConnectConnectionState>(
    HashConnectConnectionState.Disconnected
  );

  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const hashconnect = new HashConnect(LedgerId.TESTNET, PROJECT_ID, APP_METADATA, true);
    hashconnectRef.current = hashconnect;
    let mounted = true;

    const pairingCallback = (newPairing: HashConnectTypes.SavedPairingData) => {
      if (!mounted) return;
      setPairingData(newPairing);
    };

    const stateCallback = (state: HashConnectConnectionState) => {
      if (!mounted) return;
      setWalletState(state);
    };

    hashconnect.pairingEvent.on(pairingCallback);
    hashconnect.connectionStatusChangeEvent.on(stateCallback);

    const init = async () => {
      try {
        const initData = await hashconnect.init();
        if (!mounted || !initData) return;
        setTopic(initData.topic);
        setWalletState(hashconnect.hcData?.state ?? HashConnectConnectionState.Disconnected);
        if (initData.pairingData?.length) {
          setPairingData(initData.pairingData[0]);
        }
        hashconnect.findLocalWallets();
      } catch (error) {
        console.error('Failed to initialise HashConnect', error);
      }
    };

    init();

    return () => {
      mounted = false;
      hashconnect.pairingEvent.off(pairingCallback);
      hashconnect.connectionStatusChangeEvent.off(stateCallback);
      hashconnectRef.current?.disconnect(pairingData?.topic);
    };
  }, []);

  const connect = useCallback(async () => {
    const hashconnect = hashconnectRef.current;
    if (!hashconnect) return;
    if (walletState === HashConnectConnectionState.Connecting) return;

    if (!topic) {
      const initData = await hashconnect.init();
      if (!initData) return;
      setTopic(initData.topic);
      const pairingString = await hashconnect.connect();
      setPairingString(pairingString);
    } else if (!pairingData) {
      const pairingString = await hashconnect.connect();
      setPairingString(pairingString);
    }
  }, [topic, walletState, pairingData]);

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
      pairingString,
      accountId: pairingData?.accountIds?.[0],
      topic,
      isConnected: !!pairingData?.accountIds?.length,
      walletState: walletStateLabel,
      hashconnect: hashconnectRef.current
    }),
    [connect, disconnect, pairingData, topic, walletStateLabel]
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


