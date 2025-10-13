import React, { useState } from 'react';
import ButtonPrimary from '../components/ButtonPrimary';
import Panel from '../components/Panel';
import * as tx from '../lib/tx';

const AgentBond: React.FC = () => {
  const [depositAmount, setDepositAmount] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState(0);

  return (
    <div className="max-w-lg mx-auto mt-10 space-y-6">
      <h1 className="text-3xl font-bold">Agent | Bond</h1>
      <Panel>
        <h2 className="text-xl font-bold mb-4">Deposit</h2>
        <form>
          <div className="space-y-4">
            <div>
              <label className="block text-text-dim">Amount</label>
              <input type="number" value={depositAmount} onChange={(e) => setDepositAmount(Number(e.target.value))} className="w-full bg-panel border border-line rounded p-2" />
            </div>
          </div>
          <div className="mt-6">
            <ButtonPrimary type="button" onClick={() => tx.bondDeposit(depositAmount)} data-testid="bond-deposit">Deposit</ButtonPrimary>
          </div>
        </form>
      </Panel>

      <Panel>
        <h2 className="text-xl font-bold mb-4">Withdraw</h2>
        <form>
          <div className="space-y-4">
            <div>
              <label className="block text-text-dim">Amount</label>
              <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(Number(e.target.value))} className="w-full bg-panel border border-line rounded p-2" />
            </div>
          </div>
          <div className="mt-6">
            <ButtonPrimary type="button" onClick={() => tx.bondWithdraw(withdrawAmount)} data-testid="bond-withdraw">Withdraw</ButtonPrimary>
          </div>
        </form>
      </Panel>
    </div>
  );
};

export default AgentBond;
