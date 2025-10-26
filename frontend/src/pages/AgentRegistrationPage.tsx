import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AgentRegistrationPayload } from '../types/order';
import { useHashConnect } from '../hooks/useHashConnect';
import './PageStyles.css';

const defaultPayload: AgentRegistrationPayload = {
  legalName: '',
  operatingRegions: [],
  certifications: [],
  baseLocation: '',
  complianceContact: '',
  coldChainCapable: false,
  insuranceProvider: '',
  fleetDescription: '',
  proofUrl: ''
};

const AgentRegistrationPage = () => {
  const navigate = useNavigate();
  const { accountId } = useHashConnect();
  const [payload, setPayload] = useState(defaultPayload);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field: keyof AgentRegistrationPayload, value: unknown) => {
    setPayload((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    console.info('Submitting agent registration', { accountId, payload });
    setTimeout(() => navigate('/agents/status', { state: { legalName: payload.legalName } }), 200);
  };

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Become a Zeta agent</h2>
          <p>Provide credentials, insurance and compliance details. Manual review is swift.</p>
        </div>
      </header>
      <form className="panel" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            Legal entity name
            <input
              required
              value={payload.legalName}
              onChange={(event) => handleChange('legalName', event.target.value)}
            />
          </label>
          <label>
            Base location
            <input
              required
              value={payload.baseLocation}
              onChange={(event) => handleChange('baseLocation', event.target.value)}
            />
          </label>
          <label>
            Operating regions (comma separated)
            <input
              placeholder="EU, APAC, LATAM"
              value={payload.operatingRegions.join(', ')}
              onChange={(event) => handleChange('operatingRegions', event.target.value.split(',').map((item) => item.trim()))}
            />
          </label>
          <label>
            Certifications (comma separated)
            <input
              placeholder="GDP, ISO 28000"
              value={payload.certifications.join(', ')}
              onChange={(event) => handleChange('certifications', event.target.value.split(',').map((item) => item.trim()))}
            />
          </label>
          <label>
            Compliance contact
            <input
              type="email"
              required
              value={payload.complianceContact}
              onChange={(event) => handleChange('complianceContact', event.target.value)}
            />
          </label>
          <label>
            Insurance provider
            <input
              required
              value={payload.insuranceProvider}
              onChange={(event) => handleChange('insuranceProvider', event.target.value)}
            />
          </label>
          <label>
            Cold chain capable
            <select
              value={payload.coldChainCapable ? 'yes' : 'no'}
              onChange={(event) => handleChange('coldChainCapable', event.target.value === 'yes')}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </label>
          <label>
            Fleet details
            <textarea
              placeholder="Summarise vehicle capacity, specialised handling, etc."
              value={payload.fleetDescription}
              onChange={(event) => handleChange('fleetDescription', event.target.value)}
            />
          </label>
          <label>
            Proof bundle URL
            <input
              type="url"
              placeholder="Upload docs to IPFS and paste link"
              value={payload.proofUrl}
              onChange={(event) => handleChange('proofUrl', event.target.value)}
            />
          </label>
        </div>
        <button type="submit">Submit for review</button>
        {submitted && <p className="muted">Submitted. We will notify you once whitelist is granted.</p>}
      </form>
    </section>
  );
};

export default AgentRegistrationPage;

