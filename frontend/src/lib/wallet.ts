import {
  HederaSessionEvent,
  HederaJsonRpcMethod,
  DAppConnector,
  HederaChainId,
  HederaProvider,
  DAppSigner,
} from '@hashgraph/hedera-wallet-connect';
import { LedgerId } from '@hashgraph/sdk';
import { useWalletStore } from '../state/wallet.store';

const metadata = {
  name: "Zeta",
  description: "Zeta | Hedera Global Onchain",
  url: "https://app.zeta.global",
  icons: ["https://www.zeta.global/favicon.ico"],
};

export let dAppConnector: DAppConnector | undefined;

export const initHashConnect = async () => {
  if (!dAppConnector) {
    dAppConnector = new DAppConnector(
      metadata,
      LedgerId.TESTNET,
      import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
      Object.values(HederaJsonRpcMethod),
      [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
      [HederaChainId.Testnet],
    );
    await dAppConnector.init({ logger: 'error' });

    dAppConnector.pairingEvent.on((pairingData) => {
      const accountId = pairingData.accountIds[0];
      useWalletStore.getState().setConnected(true);
      useWalletStore.getState().setAccount(accountId);
    });

    dAppConnector.connectionStatusChangeEvent.on((connectionStatus) => {
      if (connectionStatus === 'Disconnected') {
        useWalletStore.getState().setConnected(false);
        useWalletStore.getState().setAccount(null);
      }
    });
  }
  return dAppConnector;
};

export const connectWallet = async () => {
  if (!dAppConnector) {
    await initHashConnect();
  }
  await dAppConnector!.openModal();
};

export const disconnectWallet = async () => {
  if (dAppConnector) {
    dAppConnector.disconnect();
  }
};

export const getSigner = () => {
  const { account } = useWalletStore.getState();
  if (!dAppConnector || !account) {
    throw new Error('Wallet not connected');
  }
  const provider = dAppConnector.getProvider('testnet', dAppConnector.pairingData?.topic!, account) as HederaProvider;
  return new DAppSigner(provider, dAppConnector.client, dAppConnector.walletConnect);
};
