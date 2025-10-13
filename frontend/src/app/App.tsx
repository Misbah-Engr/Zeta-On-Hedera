import React, { useEffect } from 'react';
import AppRouter from './routes';
import { useSessionStore } from '../state/session.store';
import { useWalletStore } from '../state/wallet.store';
import AlertBar from '../components/AlertBar';
import { useAlertStore } from '../state/alert.store';
import { initHashConnect } from '../lib/wallet';

function App() {
  const { isSigned } = useSessionStore();
  const { isConnected } = useWalletStore();
  const { message, type } = useAlertStore();

  useEffect(() => {
    initHashConnect();
  }, []);

  return (
    <div className="bg-bg text-text min-h-screen">
      <header className="p-4 border-b border-line">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Zeta</h1>
          <div className="flex space-x-4">
            <span>Session: {isSigned ? 'Signed' : 'Not signed'}</span>
            <span>Wallet: {isConnected ? 'Connected' : 'Not connected'}</span>
          </div>
        </div>
      </header>

      {message && type && <AlertBar message={message} type={type} />}

      <main className="container mx-auto p-4">
        <AppRouter />
      </main>

      <footer className="p-4 text-center text-text-dim">
        <a href="#" className="mr-4">Terms</a>
        <a href="#" className="mr-4">Privacy</a>
        <a href="#">Help</a>
      </footer>
    </div>
  );
}

export default App;
