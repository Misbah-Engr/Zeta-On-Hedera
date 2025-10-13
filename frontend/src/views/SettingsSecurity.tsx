import React from 'react';
import ButtonPrimary from '../components/ButtonPrimary';
import Panel from '../components/Panel';
import { useWalletStore } from '../state/wallet.store';
import { connectWallet, disconnectWallet } from '../lib/wallet';

const SettingsSecurity: React.FC = () => {
  const { isConnected, account } = useWalletStore();

  return (
    <div className="max-w-lg mx-auto mt-10 space-y-6">
      <h1 className="text-3xl font-bold">Settings | Security</h1>
      <Panel>
        <h2 className="text-xl font-bold mb-4">Session | Passkeys</h2>
        {/* Passkey list placeholder */}
        <div className="flex space-x-4 mt-4">
          <ButtonPrimary>Add passkey</ButtonPrimary>
          <ButtonPrimary>Remove</ButtonPrimary>
        </div>
      </Panel>

      <Panel>
        <h2 className="text-xl font-bold mb-4">Wallet | Connection</h2>
        {isConnected ? (
          <div>
            <p>Connected as: <span className="font-mono">{account}</span></p>
            <ButtonPrimary onClick={disconnectWallet}>Disconnect</ButtonPrimary>
          </div>
        ) : (
          <ButtonPrimary onClick={connectWallet} data-testid="connect-wallet">Connect wallet</ButtonPrimary>
        )}
      </Panel>
    </div>
  );
};

export default SettingsSecurity;
