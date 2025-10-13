import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import ButtonPrimary from '../components/ButtonPrimary';
import Panel from '../components/Panel';
import KeyValue from '../components/KeyValue';
import * as tx from '../lib/tx';
import { useQuery } from '@tanstack/react-query';
import { client, GET_QUOTES_QUERY } from '../lib/gql';
import Skeleton from '../components/Skeleton';
import { ethers } from 'ethers';

const QuotesCompare: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ['quotes', id],
    queryFn: async () => client.request(GET_QUOTES_QUERY, { orderId: id }),
    enabled: !!id,
  });

  const quotes = data?.quotes;

  const [commit, setCommit] = useState({ ttl: '60', salt: '' });
  const [reveal, setReveal] = useState({ feeTotal: '100', holdbackBps: '500', microbondBps: '500', etaHours: '24', salt: '' });

  const handleCommitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCommit({ ...commit, [e.target.name]: e.target.value });
  }

  const handleRevealChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReveal({ ...reveal, [e.target.name]: e.target.value });
  }

  const handleCommit = () => {
    // In a real scenario, the commit hash would be calculated based on the reveal data
    // keccak256(abi.encodePacked(orderId, feeTotal, holdbackBps, microbondBps, etaHours, salt))
    const commitHash = ethers.solidityPackedKeccak256(
      ['uint256', 'uint256', 'uint16', 'uint16', 'uint32', 'bytes32'],
      [id, reveal.feeTotal, reveal.holdbackBps, reveal.microbondBps, reveal.etaHours, reveal.salt]
    );
    tx.commitQuote(id!, commitHash, parseInt(commit.ttl, 10));
  };

  const handleReveal = () => {
    tx.revealQuote(id!, {
      feeTotal: parseInt(reveal.feeTotal, 10),
      holdbackBps: parseInt(reveal.holdbackBps, 10),
      microbondBps: parseInt(reveal.microbondBps, 10),
      etaHours: parseInt(reveal.etaHours, 10),
      salt: reveal.salt,
    });
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 space-y-6">
      <h1 className="text-3xl font-bold">Quotes | Compare</h1>
      <Panel>
        <h2 className="text-xl font-bold mb-4">Quote Summary</h2>
        <KeyValue label="Order ID" value={id} isMono />
        <div className="mt-4">
          <ButtonPrimary onClick={() => tx.autoSelect(id!)}>Auto select Best Quote</ButtonPrimary>
        </div>
      </Panel>

      <Panel>
        <h2 className="text-xl font-bold mb-4">Commit a Quote</h2>
        <div className="space-y-4">
          <input name="ttl" value={commit.ttl} onChange={handleCommitChange} placeholder="Commit TTL (minutes)" className="w-full bg-panel border border-line rounded p-2"/>
          <input name="salt" value={commit.salt} onChange={handleCommitChange} placeholder="Salt (32 bytes hex)" className="w-full bg-panel border border-line rounded p-2"/>
        </div>
        <div className="mt-4">
          <ButtonPrimary onClick={handleCommit}>Commit</ButtonPrimary>
        </div>
      </Panel>
      <Panel>
        <h2 className="text-xl font-bold mb-4">Reveal a Quote</h2>
        <div className="space-y-4">
           <input name="feeTotal" value={reveal.feeTotal} onChange={handleRevealChange} placeholder="Fee Total" className="w-full bg-panel border border-line rounded p-2"/>
           <input name="holdbackBps" value={reveal.holdbackBps} onChange={handleRevealChange} placeholder="Holdback BPS" className="w-full bg-panel border border-line rounded p-2"/>
           <input name="microbondBps" value={reveal.microbondBps} onChange={handleRevealChange} placeholder="Microbond BPS" className="w-full bg-panel border border-line rounded p-2"/>
           <input name="etaHours" value={reveal.etaHours} onChange={handleRevealChange} placeholder="ETA Hours" className="w-full bg-panel border border-line rounded p-2"/>
           <input name="salt" value={reveal.salt} onChange={handleRevealChange} placeholder="Salt" className="w-full bg-panel border border-line rounded p-2"/>
        </div>
        <div className="mt-4">
          <ButtonPrimary onClick={handleReveal}>Reveal quote</ButtonPrimary>
        </div>
      </Panel>

      <Panel>
        <h2 className="text-xl font-bold mb-4">Candidate Quotes</h2>
        {isLoading ? <Skeleton /> : (
          <table className="w-full text-left">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Fee Total</th>
                <th>ETA</th>
                <th>Holdback</th>
                <th>Microbond</th>
                <th>Risk</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {quotes?.map((quote: any) => (
                <tr key={quote.agent}>
                  <td>{quote.agent}</td>
                  <td>{quote.feeTotal}</td>
                  <td>{quote.etaHours}h</td>
                  <td>{quote.holdbackBps / 100}%</td>
                  <td>{quote.microbondBps / 100}%</td>
                  <td>{/* Risk data would come from agent query */}</td>
                  <td><ButtonPrimary>Select this quote</ButtonPrimary></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  );
};

export default QuotesCompare;
