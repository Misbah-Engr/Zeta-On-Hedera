import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useOrderbookApi } from '../services/zetaOrderbook';
import { Dispute } from '../types/order';
import { useHashConnect } from '../hooks/useHashConnect';
import './PageStyles.css';

const DisputeFlowPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { accountId } = useHashConnect();
  const { fetchDispute } = useOrderbookApi();
  const [dispute, setDispute] = useState<Dispute | undefined>();
  const [statement, setStatement] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const result = await fetchDispute(orderId);
        if (mounted) setDispute(result);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [orderId, fetchDispute]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!orderId || !accountId) return;
    setSubmitted(true);
    // Integration point: submit dispute transaction to smart contract
    console.info('Submitting dispute', { orderId, statement, evidenceUrl, accountId });
  };

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Dispute order #{orderId}</h2>
          <p>Escalate disagreements with verifiable evidence. Mediators review quickly.</p>
        </div>
      </header>
      <div className="split">
        <form className="panel" onSubmit={handleSubmit}>
          <h3>Your submission</h3>
          <div className="form-grid">
            <label>
              Summary
              <textarea
                required
                placeholder="Describe the issue succinctly"
                value={statement}
                onChange={(event) => setStatement(event.target.value)}
              />
            </label>
            <label>
              Evidence URL
              <input
                type="url"
                required
                placeholder="IPFS / Arweave / HTTPS link"
                value={evidenceUrl}
                onChange={(event) => setEvidenceUrl(event.target.value)}
              />
            </label>
          </div>
          <button type="submit">Submit to mediator</button>
          {submitted && <p className="muted">Dispute submitted. Track status in the panel.</p>}
        </form>
        <aside className="panel">
          <h3>Current status</h3>
          {loading && <p>Syncing ledger…</p>}
          {!loading && !dispute && <p>No dispute active yet.</p>}
          {!loading && dispute && (
            <div>
              <p>
                <strong>Stage:</strong> {dispute.stage}
              </p>
              <p>
                <strong>Claimant:</strong> {dispute.claimant}
              </p>
              <p>
                <strong>Evidence:</strong> {dispute.evidence || '—'}
              </p>
              <p>
                <strong>Resolution:</strong> {dispute.resolution || 'Pending mediator decision'}
              </p>
            </div>
          )}
          <button type="button" className="ghost" onClick={() => navigate(-1)}>
            Back
          </button>
        </aside>
      </div>
    </section>
  );
};

export default DisputeFlowPage;

