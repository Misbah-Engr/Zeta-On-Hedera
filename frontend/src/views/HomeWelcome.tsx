import React from 'react';
import ButtonPrimary from '../components/ButtonPrimary';
import Panel from '../components/Panel';
import { connectWallet } from '../lib/wallet';

const HomeWelcome: React.FC = () => {
  return (
    <div className="max-w-md mx-auto mt-10">
      <Panel>
        <h1 className="text-2xl font-bold text-center mb-6">Welcome to Zeta</h1>
        <div className="space-y-4">
          <ButtonPrimary data-testid="create-passkey">
            Create passkey
          </ButtonPrimary>
          <ButtonPrimary data-testid="connect-wallet" onClick={connectWallet}>
            Connect wallet
          </ButtonPrimary>
        </div>
      </Panel>
    </div>
  );
};

export default HomeWelcome;
