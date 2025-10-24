/// <reference types="vite/client" />

declare module "hashconnect" {
  export namespace HashConnectTypes {
    type NetworkName = "mainnet" | "testnet" | "previewnet";
    interface AppMetadata {
      name: string;
      description: string;
      icon: string;
    }
    interface WalletMetadata {
      name: string;
      description?: string;
      icon?: string;
    }
    interface SavedPairingData {
      accountIds: string[];
      network: NetworkName;
      topic: string;
      walletMetadata?: WalletMetadata;
    }
  }

  export class HashConnect {
    init(appMetadata: HashConnectTypes.AppMetadata, network: HashConnectTypes.NetworkName, singleAccount: boolean): Promise<{
      topic: string;
      savedPairings: HashConnectTypes.SavedPairingData[];
    }>;
    getProvider(network: HashConnectTypes.NetworkName, topic: string, accountId: string): unknown;
    connectToLocalWallet(): void;
    clearConnectionsAndData(): void;
    disconnect(): void;
    pairingEvent: {
      on(listener: (data: HashConnectTypes.SavedPairingData) => void): void;
      off(listener: (data: HashConnectTypes.SavedPairingData) => void): void;
    };
  }
}
