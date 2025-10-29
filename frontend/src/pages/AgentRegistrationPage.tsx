import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AgentRegistrationPayload } from '../types/order'
import { useAccount } from 'wagmi'
import { TurnstileWidget } from '../components/TurnstileWidget'
import { presignAgentDocument, submitAgent, updateAgentDocument, uploadAgentManifest } from '../services/worker'
import './PageStyles.css'

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
}

type SelectedDocument = {
  id: string
  file: File
  docType: string
  status: 'pending' | 'uploading' | 'uploaded' | 'error'
  message?: string
  documentId?: string
  key?: string
  sha256?: string
}

const DOC_OPTIONS = [
  { value: 'company_reg', label: 'Company registration' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'gdp', label: 'GDP certification' },
  { value: 'iso', label: 'ISO certification' },
  { value: 'cold_chain', label: 'Cold chain evidence' },
  { value: 'permit', label: 'Permit / license' },
  { value: 'id', label: 'Government ID' },
  { value: 'other', label: 'Other supporting doc' }
]

const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined

const AgentRegistrationPage = () => {
  const navigate = useNavigate()
  const { address: accountId } = useAccount()
  const [payload, setPayload] = useState(defaultPayload)
  const [documents, setDocuments] = useState<SelectedDocument[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  useEffect(() => {
    if (!turnstileSiteKey) {
      setTurnstileToken('dev-bypass')
    }
  }, [])

  const handleChange = (field: keyof AgentRegistrationPayload, value: unknown) => {
    setPayload((prev) => ({ ...prev, [field]: value }))
  }

  const addDocuments = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return
    const next: SelectedDocument[] = []
    for (const file of files) {
      next.push({ id: crypto.randomUUID(), file, docType: 'other', status: 'pending' })
    }
    setDocuments((prev) => [...prev, ...next])
    event.target.value = ''
  }

  const updateDocType = (id: string, docType: string) => {
    setDocuments((prev) => prev.map((doc) => (doc.id === id ? { ...doc, docType } : doc)))
  }

  const removeDocument = (id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id))
  }

  const siteKeyActive = useMemo(() => Boolean(turnstileSiteKey), [turnstileSiteKey])

  const hashFile = async (file: File) => {
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    return Array.from(new Uint8Array(hashBuffer))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!accountId) {
      setError('Connect your wallet before submitting')
      return
    }
    if (siteKeyActive && !turnstileToken) {
      setError('Complete the Turnstile challenge to continue')
      return
    }
    try {
      setSubmitting(true)
      setError(null)
      const response = await submitAgent(
        {
          walletAddress: accountId,
          legalName: payload.legalName,
          baseLocation: payload.baseLocation,
          complianceContact: payload.complianceContact,
          coldChainCapable: payload.coldChainCapable,
          fleetDetails: payload.fleetDescription,
          insuranceProvider: payload.insuranceProvider,
          operatingRegions: payload.operatingRegions,
          certifications: payload.certifications,
          proofBundleUrl: payload.proofUrl
        },
        turnstileToken || undefined
      )

      const manifestEntries: { documentId?: string; name: string; docType: string; sha256: string; href: string }[] = []

      for (const selected of documents) {
        setDocuments((prev) => prev.map((doc) => (doc.id === selected.id ? { ...doc, status: 'uploading', message: 'Requesting upload link…' } : doc)))
        try {
          const presign = await presignAgentDocument(response.id, {
            name: selected.file.name,
            contentType: selected.file.type,
            docType: selected.docType
          })

          setDocuments((prev) =>
            prev.map((doc) =>
              doc.id === selected.id
                ? { ...doc, status: 'uploading', message: 'Uploading to secure storage…', documentId: presign.documentId, key: presign.key }
                : doc
            )
          )

          const uploadResponse = await fetch(presign.putUrl, {
            method: 'PUT',
            headers: { 'content-type': selected.file.type || 'application/octet-stream' },
            body: selected.file
          })
          if (!uploadResponse.ok) {
            throw new Error('upload_failed')
          }

          const sha256 = await hashFile(selected.file)
          await updateAgentDocument(response.id, presign.documentId, {
            docType: selected.docType,
            sha256,
            url: `r2://${presign.key}`
          })

          manifestEntries.push({
            documentId: presign.documentId,
            name: selected.file.name,
            docType: selected.docType,
            sha256,
            href: `r2://${presign.key}`
          })

          setDocuments((prev) =>
            prev.map((doc) =>
              doc.id === selected.id
                ? { ...doc, status: 'uploaded', message: 'Uploaded', sha256 }
                : doc
            )
          )
        } catch (uploadError) {
          console.error('document_upload_failed', uploadError)
          setDocuments((prev) =>
            prev.map((doc) =>
              doc.id === selected.id
                ? { ...doc, status: 'error', message: 'Upload failed. Remove and retry.' }
                : doc
            )
          )
        }
      }

      if (manifestEntries.length > 0) {
        try {
          await uploadAgentManifest(response.id, manifestEntries)
        } catch (manifestError) {
          console.error('manifest_upload_failed', manifestError)
        }
      }

      setSubmitted(true)
      navigate('/agents/status', { state: { legalName: payload.legalName, agentId: response.id } })
    } catch (submissionError: any) {
      console.error('agent_submit_failed', submissionError)
      setError(submissionError?.error || submissionError?.message || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

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
              onChange={(event) =>
                handleChange(
                  'operatingRegions',
                  event.target.value.split(',').map((item) => item.trim()).filter(Boolean)
                )
              }
            />
          </label>
          <label>
            Certifications (comma separated)
            <input
              placeholder="GDP, ISO 28000"
              value={payload.certifications.join(', ')}
              onChange={(event) =>
                handleChange(
                  'certifications',
                  event.target.value.split(',').map((item) => item.trim()).filter(Boolean)
                )
              }
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
            Proof bundle URL (optional)
            <input
              type="url"
              placeholder="Upload docs to IPFS and paste link"
              value={payload.proofUrl}
              onChange={(event) => handleChange('proofUrl', event.target.value)}
            />
          </label>
        </div>

        <fieldset className="panel muted">
          <legend>Compliance documents</legend>
          <input type="file" multiple onChange={addDocuments} />
          <div className="doc-list">
            {documents.map((doc) => (
              <div key={doc.id} className={`doc-item doc-${doc.status}`}>
                <div>
                  <strong>{doc.file.name}</strong>
                  <p>{doc.message || `${(doc.file.size / 1024).toFixed(1)} KB`}</p>
                  {doc.sha256 && <code className="hash">{doc.sha256}</code>}
                </div>
                <label>
                  Type
                  <select value={doc.docType} onChange={(event) => updateDocType(doc.id, event.target.value)}>
                    {DOC_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="button" className="doc-remove" onClick={() => removeDocument(doc.id)}>Remove</button>
              </div>
            ))}
            {!documents.length && <p className="muted">Attach insurance, licenses, and certifications. You can upload multiple files.</p>}
          </div>
        </fieldset>

        {siteKeyActive && (
          <div className="turnstile-wrapper">
            <TurnstileWidget
              siteKey={turnstileSiteKey!}
              onSuccess={(token) => setTurnstileToken(token)}
              onError={() => setTurnstileToken(null)}
              appearance="interaction-only"
            />
          </div>
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit for review'}
        </button>
        {error && <p className="error">{error}</p>}
        {submitted && <p className="muted">Submitted. We will notify you once whitelist is granted.</p>}
      </form>
    </section>
  )
}

export default AgentRegistrationPage
