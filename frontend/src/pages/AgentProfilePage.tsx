import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useOrderbookApi } from '../services/zetaOrderbook';
import { AgentAd, AgentProfile } from '../types/order';
import './PageStyles.css';

const AgentProfilePage = () => {
  const { agentId } = useParams();
  const { fetchAgentProfile, fetchAgentAds } = useOrderbookApi();
  const [profile, setProfile] = useState<AgentProfile | undefined>();
  const [ads, setAds] = useState<AgentAd[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!agentId) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [profileData, adsData] = await Promise.all([
          fetchAgentProfile(agentId),
          fetchAgentAds(agentId)
        ]);
        if (!mounted) return;
        setProfile(profileData);
        setAds(adsData);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [agentId, fetchAgentProfile, fetchAgentAds]);

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>{profile?.handle ?? agentId}</h2>
          <p>{profile?.bio ?? 'Agent profile loading…'}</p>
        </div>
        <Link to="/ads">Back to ads</Link>
      </header>
      <div className="split">
        <div className="panel">
          <h3>Performance</h3>
          {loading && <p>Syncing ledger…</p>}
          {!loading && profile && (
            <div className="metrics">
              <p>
                <strong>Rating:</strong> {profile.rating.toFixed(1)}
              </p>
              <p>
                <strong>Completed:</strong> {profile.completedDeliveries}
              </p>
              <p>
                <strong>Disputed:</strong> {profile.disputedDeliveries}
              </p>
              <p>
                <strong>Base:</strong> {profile.baseLocation}
              </p>
            </div>
          )}
        </div>
        <div className="panel">
          <h3>Active ads</h3>
          {loading && <p>Loading ads…</p>}
          {!loading && (
            <div className="card-grid">
              {ads.map((ad) => (
                <article key={ad.id} className="card">
                  <div className="card-body">
                    <h3>{ad.commodity}</h3>
                    <p>{ad.location}</p>
                    <div className="pricing">
                      <strong>{ad.price}</strong>
                      <small>
                        {ad.minWeight}kg - {ad.maxWeight}kg
                      </small>
                    </div>
                  </div>
                  <footer className="card-footer">
                    <span className={`chip chip-${ad.availability.toLowerCase()}`}>
                      {ad.availability}
                    </span>
                  </footer>
                </article>
              ))}
              {!ads.length && <div className="card muted">No open ads right now.</div>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AgentProfilePage;

