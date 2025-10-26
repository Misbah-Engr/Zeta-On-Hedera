import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrderbookApi } from '../services/zetaOrderbook';
import { AgentAd } from '../types/order';
import './PageStyles.css';

interface FilterState {
  search: string;
  commodity: string;
  availability: string;
}

const initialFilters: FilterState = {
  search: '',
  commodity: 'all',
  availability: 'all'
};

const AdsPage = () => {
  const [filters, setFilters] = useState(initialFilters);
  const [ads, setAds] = useState<AgentAd[]>([]);
  const [loading, setLoading] = useState(false);
  const { fetchActiveAds } = useOrderbookApi();

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchActiveAds();
        if (isMounted) setAds(data);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [fetchActiveAds]);

  const commodities = useMemo(() => ['all', ...new Set(ads.map((ad) => ad.commodity))], [ads]);

  const filteredAds = useMemo(() => {
    return ads.filter((ad) => {
      const matchesSearch =
        !filters.search ||
        ad.location.toLowerCase().includes(filters.search.toLowerCase()) ||
        ad.commodity.toLowerCase().includes(filters.search.toLowerCase());
      const matchesCommodity = filters.commodity === 'all' || ad.commodity === filters.commodity;
      const matchesAvailability =
        filters.availability === 'all' || ad.availability === filters.availability;
      return matchesSearch && matchesCommodity && matchesAvailability;
    });
  }, [ads, filters]);

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Find vetted logistics agents</h2>
          <p>Filter by corridors, commodity, or availability before matching instantly.</p>
        </div>
        <div className="filters">
          <input
            placeholder="Search lanes or commodity"
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
          />
          <select
            value={filters.commodity}
            onChange={(event) => setFilters((prev) => ({ ...prev, commodity: event.target.value }))}
          >
            {commodities.map((commodity) => (
              <option key={commodity} value={commodity}>
                {commodity === 'all' ? 'All commodities' : commodity}
              </option>
            ))}
          </select>
          <select
            value={filters.availability}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, availability: event.target.value }))
            }
          >
            <option value="all">Availability</option>
            <option value="Available">Available</option>
            <option value="Queueing">Queueing</option>
            <option value="Unavailable">Unavailable</option>
          </select>
        </div>
      </header>
      {loading ? (
        <div className="card-grid"><div className="card loading">Syncing ledger…</div></div>
      ) : (
        <div className="card-grid">
          {filteredAds.map((ad) => (
            <article key={ad.id} className="card">
              <header className="card-header">
                <Link to={`/agents/${ad.agentId}`} className="agent-head">
                  <div className="avatar" aria-hidden>
                    {ad.agentId.split('.').pop()}
                  </div>
                  <div>
                    <span className="agent-handle">{ad.agentId}</span>
                    <span className="agent-meta">Tap to view profile</span>
                  </div>
                </Link>
                <span className={`chip chip-${ad.availability.toLowerCase()}`}>
                  {ad.availability}
                </span>
              </header>
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
                <Link to={`/agents/${ad.agentId}`} className="cta">
                  View agent markets
                </Link>
              </footer>
            </article>
          ))}
          {!filteredAds.length && (
            <div className="card muted">No agents match your filters yet.</div>
          )}
        </div>
      )}
    </section>
  );
};

export default AdsPage;

