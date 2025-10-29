import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useOrderbookApi } from '../services/zetaOrderbook'
import './PageStyles.css'

const AgentStatusPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { address } = useAccount()
  const { fetchAgentStatusByWallet } = useOrderbookApi()
  const legalName = (location.state as { legalName?: string } | undefined)?.legalName
  const [status, setStatus] = useState<string>('submitted')
  const [agentId, setAgentId] = useState<string | undefined>((location.state as { agentId?: string } | undefined)?.agentId)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    if (!address) return
    const load = async () => {
      setLoading(true)
      try {
        const agent = await fetchAgentStatusByWallet(address)
        if (!mounted || !agent) return
        setStatus(agent.status)
        setAgentId(agent.id)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [address, fetchAgentStatusByWallet])

  const statusCopy: Record<string, string> = {
    draft: 'Draft saved. Complete compliance uploads to submit.',
    submitted: 'Awaiting reviewer triage. We will contact you shortly.',
    under_review: 'Reviewer is assessing your documentation.',
    approved: 'Approved! Ads unlock immediately and whitelist tx is queued.',
    rejected: 'Rejected. Reviewer notes available in dashboard.',
    suspended: 'Suspended pending remediation.'
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Registration status</h2>
          <p>We are validating your credentials and compliance documents.</p>
        </div>
      </header>
      <div className="panel">
        <p>
          {legalName ? (
            <>
              <strong>{legalName}</strong>
              {agentId && (
                <span>
                  {' '}• Submission ID: <code>{agentId}</code>
                </span>
              )}
            </>
          ) : (
            'Your submission is in review. Return to dashboard while you wait.'
          )}
        </p>
        <ul>
          <li>Status: {loading ? 'Syncing…' : status}</li>
          <li>Summary: {statusCopy[status] || 'We will keep you posted with reviewer updates.'}</li>
          <li>Notification: Push + email once approved</li>
          <li>Next steps: Configure ads immediately after approval</li>
        </ul>
        <button type="button" onClick={() => navigate('/ads')}>
          Discover demand
        </button>
      </div>
    </section>
  )
}

export default AgentStatusPage
