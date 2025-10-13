import { create } from 'zustand';

type AlertType = 'success' | 'error' | 'info';

interface AlertState {
  message: string | null;
  type: AlertType | null;
  showAlert: (message: string, type: AlertType) => void;
  hideAlert: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  message: null,
  type: null,
  showAlert: (message, type) => set({ message, type }),
  hideAlert: () => set({ message: null, type: null }),
}));
