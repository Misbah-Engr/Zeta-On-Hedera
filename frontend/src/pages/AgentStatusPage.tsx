import { useLocation, useNavigate } from 'react-router-dom';
import './PageStyles.css';

const AgentStatusPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const legalName = (location.state as { legalName?: string } | undefined)?.legalName;

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Registration received</h2>
          <p>We are validating your credentials and compliance documents.</p>
        </div>
      </header>
      <div className="panel">
        <p>
          {legalName ? (
            <>
              <strong>{legalName}</strong> has entered the whitelist queue. Expect decision in under
              24 hours.
            </>
          ) : (
            'Your submission is in review. Return to dashboard while you wait.'
          )}
        </p>
        <ul>
          <li>Status: Awaiting whitelist</li>
          <li>Notification: Push + email once approved</li>
          <li>Next steps: Configure ads immediately after approval</li>
        </ul>
        <button type="button" onClick={() => navigate('/ads')}>
          Discover demand
        </button>
      </div>
    </section>
  );
};

export default AgentStatusPage;

