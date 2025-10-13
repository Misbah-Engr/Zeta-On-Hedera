import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ButtonPrimary from '../components/ButtonPrimary';
import Panel from '../components/Panel';
import KeyValue from '../components/KeyValue';
import { useQuery } from '@tanstack/react-query';
import { client, GET_AGENT_QUERY, GET_AGENT_COMMITTED_QUOTES_QUERY, GET_AGENT_REVEALED_QUOTES_QUERY, GET_AGENT_SELECTED_QUOTES_QUERY } from '../lib/gql';
import { useWalletStore } from '../state/wallet.store';
import Skeleton from '../components/Skeleton';

const AgentQuotes: React.FC<{ activeTab: string; agentAddress: string; }> = ({ activeTab, agentAddress }) => {
  const queries = {
    Committed: GET_AGENT_COMMITTED_QUOTES_QUERY,
    Revealed: GET_AGENT_REVEALED_QUOTES_QUERY,
    Selected: GET_AGENT_SELECTED_QUOTES_QUERY,
  };
  const query = queries[activeTab as keyof typeof queries];
  const queryKey = [activeTab.toLowerCase(), agentAddress];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => client.request(query, { agentAddress }),
    enabled: !!agentAddress,
  });

  const quotes = data?.commits || data?.quotes || data?.orders;

  if (isLoading) return <Skeleton />;
  if (!quotes || quotes.length === 0) return <p className="text-text-dim">No {activeTab.toLowerCase()} quotes to display.</p>;

  return (
    <ul>
      {quotes.map((q: any) => (
        <li key={q.orderId || q.id}>{q.orderId || q.id}</li>
      ))}
    </ul>
  )
};

const AgentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Committed');
  const { account } = useWalletStore();
  const { data, isLoading } = useQuery({
    queryKey: ['agent', account],
    queryFn: async () => client.request(GET_AGENT_QUERY, { agentAddress: account }),
    enabled: !!account,
  });

  const agentData = data?.agent;

  return (
    <div className="max-w-4xl mx-auto mt-10 space-y-6">
      <h1 className="text-3xl font-bold">Agent | Dashboard</h1>
      <Panel>
        <h2 className="text-xl font-bold mb-4">My Quotes</h2>
        <div className="flex space-x-4 border-b border-line mb-4">
          <button onClick={() => setActiveTab('Committed')} className={`pb-2 ${activeTab === 'Committed' ? 'border-b-2 border-accent' : ''}`}>Committed</button>
          <button onClick={() => setActiveTab('Revealed')} className={`pb-2 ${activeTab === 'Revealed' ? 'border-b-2 border-accent' : ''}`}>Revealed</button>
          <button onClick={() => setActiveTab('Selected')} className={`pb-2 ${activeTab === 'Selected' ? 'border-b-2 border-accent' : ''}`}>Selected</button>
        </div>
        <div>
          {account && <AgentQuotes activeTab={activeTab} agentAddress={account} />}
        </div>
      </Panel>

      {isLoading && <Skeleton />}
      {agentData && (
        <>
          <Panel>
            <h2 className="text-xl font-bold mb-4">My Bond</h2>
            <KeyValue label="Standing Bond" value={`${agentData.standingBond} HBAR`} />
            <KeyValue label="Locked Microbond" value={`${agentData.lockedMicrobond} HBAR`} />
            <KeyValue label="Available" value={`${agentData.standingBond - agentData.lockedMicrobond} HBAR`} />
            <div className="flex space-x-4 mt-4">
              <ButtonPrimary onClick={() => navigate('/agent/bond')}>Deposit</ButtonPrimary>
              <ButtonPrimary onClick={() => navigate('/agent/bond')}>Withdraw</ButtonPrimary>
            </div>
          </Panel>

          <Panel>
            <h2 className="text-xl font-bold mb-4">Risk</h2>
            <KeyValue label="Risk Score" value={`${agentData.riskScore / 100}%`} />
            <KeyValue label="Slashes" value={agentData.slashes} />
            <KeyValue label="Disputes Ratio" value={`${agentData.disputesRatio / 100}%`} />
            <p className="text-text-dim mt-2">Repeated slashes will lead to suspension.</p>
          </Panel>
        </>
      )}
    </div>
  );
};

export default AgentDashboard;
