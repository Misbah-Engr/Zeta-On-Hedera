import { create } from 'zustand';

interface WalletState {
  isConnected: boolean;
  account: string | null;
  setConnected: (isConnected: boolean) => void;
  setAccount: (account: string | null) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  isConnected: false,
  account: null,
  setConnected: (isConnected) => set({ isConnected }),
  setAccount: (account) => set({ account }),
}));
