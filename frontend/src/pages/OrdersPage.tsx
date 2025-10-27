import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrderbookApi } from '../services/zetaOrderbook';
import { Order } from '../types/order';
import { useAccount } from 'wagmi';
import './PageStyles.css';

const statusBadgeClass = (status: Order['status']) => `badge badge-${status.toLowerCase()}`;

const OrdersPage = () => {
  const { address: accountId } = useAccount();
  const { fetchOrdersForAccount } = useOrderbookApi();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!accountId) {
      setOrders([]);
      return;
    }
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const result = await fetchOrdersForAccount(accountId);
        if (isMounted) setOrders(result);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [accountId, fetchOrdersForAccount]);

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [orders]);

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Your orders</h2>
          <p>
            Connected account:{' '}
            {accountId ? <strong>{accountId}</strong> : 'Connect HashPack to load your escrowed orders.'}
          </p>
        </div>
      </header>
      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Route</th>
              <th>Commodity</th>
              <th>Status</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6}>Syncing ledger…</td>
              </tr>
            )}
            {!loading && sortedOrders.length === 0 && (
              <tr>
                <td colSpan={6}>No orders yet. Match with an agent to begin.</td>
              </tr>
            )}
            {!loading &&
              sortedOrders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>
                    {order.origin} → {order.destination}
                  </td>
                  <td>{order.commodity}</td>
                  <td>
                    <span className={statusBadgeClass(order.status)}>{order.status}</span>
                  </td>
                  <td>{new Date(order.updatedAt * 1000).toLocaleString()}</td>
                  <td className="table-actions">
                    <Link to={`/orders/${order.id}/lifecycle`}>Lifecycle</Link>
                    <Link to={`/orders/${order.id}/dispute`}>Dispute</Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default OrdersPage;

