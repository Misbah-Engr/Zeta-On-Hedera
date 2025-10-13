import React from 'react';
import { useQuery } from '@tanstack/react-query';
import ButtonPrimary from '../components/ButtonPrimary';
import Panel from '../components/Panel';
import Skeleton from '../components/Skeleton';
import { client, GET_ORDERS_QUERY } from '../lib/gql';
import { useWalletStore } from '../state/wallet.store';
import { useNavigate } from 'react-router-dom';

const HomeOrders: React.FC = () => {
  const navigate = useNavigate();
  const { account } = useWalletStore();
  const { data, isLoading } = useQuery({
    queryKey: ['orders', account],
    queryFn: async () => client.request(GET_ORDERS_QUERY, { userAddress: account }),
    enabled: !!account,
  });

  const handleRowClick = (orderId: string) => {
    navigate(`/order/${orderId}`);
  };

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <Panel>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Open Orders</h1>
          <div className="space-x-4">
            <ButtonPrimary onClick={() => navigate('/order/new')}>New order</ButtonPrimary>
            <ButtonPrimary onClick={() => navigate('/agent')}>Agent dashboard</ButtonPrimary>
          </div>
        </div>
        <div>
          {isLoading && <Skeleton />}
          {!isLoading && (!data || !data.orders || data.orders.length === 0) && (
            <p className="text-text-dim">You have no orders.</p>
          )}
          {!isLoading && data && data.orders && data.orders.length > 0 && (
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="p-2">Order</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Max total</th>
                  <th className="p-2">Selected agent</th>
                  <th className="p-2">Updated</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.map((order: any) => (
                  <tr key={order.id} onClick={() => handleRowClick(order.id)} className="cursor-pointer hover:bg-line">
                    <td className="p-2 font-mono">{order.id}</td>
                    <td className="p-2">{order.status}</td>
                    <td className="p-2">{order.maxTotal}</td>
                    <td className="p-2">{order.selectedAgent || '-'}</td>
                    <td className="p-2">{new Date(order.updatedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Panel>
    </div>
  );
};

export default HomeOrders;
