import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ButtonPrimary from '../components/ButtonPrimary';
import Panel from '../components/Panel';
import KeyValue from '../components/KeyValue';
import Skeleton from '../components/Skeleton';
import * as tx from '../lib/tx';
import { hashData } from '../lib/blake';
import { client, GET_ORDER_DETAILS_QUERY } from '../lib/gql';
import { useWalletStore } from '../state/wallet.store';

const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { account } = useWalletStore();
  const { data, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => client.request(GET_ORDER_DETAILS_QUERY, { orderId: id }),
    enabled: !!id,
  });

  const order = data?.order;
  const [pod, setPod] = useState({ otp: '', qr: '', waybill: '', photo: '' });

  const handlePodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPod({ ...pod, [e.target.name]: e.target.value });
  }

  const handleSubmitPod = () => {
    const podHashes: Record<string, string> = {};
    const kinds: number[] = [];

    if (pod.otp) {
      podHashes.otp = hashData(pod.otp, order!.id, import.meta.env.VITE_RP_ID);
      kinds.push(0);
    }
    if (pod.qr) {
      podHashes.qr = hashData(pod.qr, order!.id, import.meta.env.VITE_RP_ID);
      kinds.push(1);
    }
    if (pod.waybill) {
      podHashes.waybill = hashData(pod.waybill, order!.id, import.meta.env.VITE_RP_ID);
      kinds.push(2);
    }
    if (pod.photo) {
      podHashes.photo = hashData(pod.photo, order!.id, import.meta.env.VITE_RP_ID);
      kinds.push(3);
    }

    tx.submitPoD(order!.id, podHashes, kinds);
  }

  if (isLoading) {
    return <Skeleton />;
  }

  if (!order) {
    return <p>Order not found.</p>;
  }

  const currentUserIsUser = account === order.user;
  const currentUserIsAgent = account === order.agent;

  return (
    <div className="max-w-4xl mx-auto mt-10 space-y-6">
      <Panel>
        <h1 className="text-2xl font-bold mb-6">Order | Details</h1>
        <div className="grid grid-cols-2 gap-4">
          <KeyValue label="Order ID" value={order.id} isMono />
          <KeyValue label="Status" value={order.status} />
          <KeyValue label="User" value={order.user} isMono />
          <KeyValue label="Agent" value={order.agent} isMono />
          <KeyValue label="Token" value={order.token} />
          <KeyValue label="Quantity" value={order.qty} />
          <KeyValue label="Max Total" value={order.maxTotal} />
          <KeyValue label="Selected Fee" value={order.selectedFee} />
          <KeyValue label="Holdback" value={`${order.holdbackBps / 100}%`} />
          <KeyValue label="Microbond" value={`${order.microbondBps / 100}%`} />
          <KeyValue label="Treasury" value={`${order.treasuryBps / 100}%`} />
        </div>
      </Panel>

      {order.status === 'Created' && currentUserIsUser && (
        <Panel><ButtonPrimary onClick={() => tx.autoSelect(order.id)}>Auto select</ButtonPrimary></Panel>
      )}

      {order.status === 'Selected' && currentUserIsAgent && (
        <Panel><ButtonPrimary onClick={() => tx.ackSelect(order.id)}>Acknowledge</ButtonPrimary></Panel>
      )}

      {order.status === 'Accepted' && currentUserIsUser && (
         <Panel>
          <h2 className="text-xl font-bold mb-4">Fund Escrow</h2>
           <KeyValue label="Total" value={order.selectedFee} />
           <KeyValue label="Treasury" value={order.selectedFee * (order.treasuryBps / 10000)} />
            <KeyValue label="Holdback" value={order.selectedFee * (order.holdbackBps / 10000)} />
            <KeyValue label="Agent due now" value={order.selectedFee - (order.selectedFee * (order.treasuryBps / 10000)) - (order.selectedFee * (order.holdbackBps / 10000))} />
          <ButtonPrimary onClick={() => tx.userFund(order.id, order.selectedFee)}>Fund escrow</ButtonPrimary>
        </Panel>
      )}

      {order.status === 'Completed' && (
        <Panel>
          <h2 className="text-xl font-bold mb-4">Completed</h2>
          <KeyValue label="Paid to Treasury" value="..." />
          <KeyValue label="Paid to Agent" value="..." />
          <KeyValue label="Holdback Released At" value="..." />
          <ButtonPrimary onClick={() => tx.openClaim(order.id, [], [])}>Open Dispute</ButtonPrimary>
        </Panel>
      )}

      {currentUserIsAgent && order.status === 'Accepted' && (
        <Panel>
          <h2 className="text-xl font-bold mb-4">Proof of Delivery</h2>
          <div className="space-y-4">
            <input name="otp" onChange={handlePodChange} placeholder="OTP Code" className="w-full bg-panel border border-line rounded p-2"/>
            <input name="qr" onChange={handlePodChange} placeholder="QR Code" className="w-full bg-panel border border-line rounded p-2"/>
            <input name="waybill" onChange={handlePodChange} placeholder="Waybill CID" className="w-full bg-panel border border-line rounded p-2"/>
            <input name="photo" onChange={handlePodChange} placeholder="Photo CID" className="w-full bg-panel border border-line rounded p-2"/>
          </div>
          <div className="mt-4">
            <ButtonPrimary onClick={handleSubmitPod}>Submit Proof</ButtonPrimary>
          </div>
        </Panel>
      )}

      {currentUserIsUser && order.pod && order.status !== 'Completed' && (
         <Panel>
          <ButtonPrimary onClick={() => tx.markCompleted(order.id)}>Mark Completed</ButtonPrimary>
        </Panel>
      )}

      {order.status === 'Disputed' && (
        <Panel>
          <h2 className="text-xl font-bold mb-4">Dispute</h2>
          <ButtonPrimary onClick={() => tx.autoResolve(order.id)}>Resolve Now</ButtonPrimary>
        </Panel>
      )}
    </div>
  );
};

export default OrderDetails;
