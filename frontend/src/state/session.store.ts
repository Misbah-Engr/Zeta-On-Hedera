import { create } from 'zustand';

interface SessionState {
  isSigned: boolean;
  setSigned: (isSigned: boolean) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  isSigned: false,
  setSigned: (isSigned) => set({ isSigned }),
}));
