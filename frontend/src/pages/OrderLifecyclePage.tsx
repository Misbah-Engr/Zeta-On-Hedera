import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useOrderbookApi } from '../services/zetaOrderbook';
import { OrderLifecycleEvent } from '../types/order';
import './PageStyles.css';

const OrderLifecyclePage = () => {
  const { orderId } = useParams();
  const { fetchOrderTimeline, fetchDispute } = useOrderbookApi();
  const [timeline, setTimeline] = useState<OrderLifecycleEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [disputeStage, setDisputeStage] = useState<string | undefined>();

  useEffect(() => {
    if (!orderId) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [events, dispute] = await Promise.all([
          fetchOrderTimeline(orderId),
          fetchDispute(orderId)
        ]);
        if (!mounted) return;
        setTimeline(events);
        setDisputeStage(dispute?.stage);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [orderId, fetchOrderTimeline, fetchDispute]);

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Order #{orderId} lifecycle</h2>
          <p>Track onchain updates from escrow to final settlement.</p>
        </div>
        <Link to={`/orders/${orderId}/dispute`} className="cta-link">
          File or review dispute
        </Link>
      </header>
      <div className="split">
        <div className="panel">
          <h3>Timeline</h3>
          {loading ? (
            <p>Syncing ledger…</p>
          ) : (
            <div className="timeline">
              {timeline.map((event) => (
                <div key={`${event.status}-${event.at}`} className="timeline-step">
                  <h4>{event.status}</h4>
                  <time>{new Date(event.at * 1000).toLocaleString()}</time>
                  <p>{event.note}</p>
                </div>
              ))}
              {!timeline.length && <p>No events available yet.</p>}
            </div>
          )}
        </div>
        <aside className="panel">
          <h3>Dispute status</h3>
          <p>
            {disputeStage ? `Current stage: ${disputeStage}` : 'No disputes have been filed for this order.'}
          </p>
          <Link to={`/orders/${orderId}/dispute`}>Manage dispute</Link>
          <Link to="/orders">Back to orders</Link>
        </aside>
      </div>
    </section>
  );
};

export default OrderLifecyclePage;

