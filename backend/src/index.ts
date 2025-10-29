import { ulid } from 'ulid'

const AGENT_DOC_TYPES = new Set([
  'company_reg',
  'insurance',
  'gdp',
  'iso',
  'cold_chain',
  'permit',
  'id',
  'other'
])

const STORAGE_PROVIDERS = new Set(['ipfs', 'r2', 'http'])

const ORDER_STATUSES = new Set(['Created', 'Matched', 'InTransit', 'Delivered', 'Disputed', 'Resolved', 'Cancelled'])

const ORDER_DOC_TYPES = new Set(['bill_of_lading', 'temperature_log', 'proof_of_delivery', 'photo', 'invoice', 'other'])

interface AgentPayload {
  walletAddress?: string
  legalName?: string
  baseLocation?: string
  complianceContact?: string
  coldChainCapable?: boolean
  fleetDetails?: string
  insuranceProvider?: string
  operatingRegions?: string | string[]
  certifications?: string | string[]
  proofBundleUrl?: string
  proofBundleCid?: string
  feeScheduleCid?: string
  documents?: DocumentPayload[]
  riskScoreBps?: number
}

interface DocumentPayload {
  docType: string
  storageProvider: string
  url?: string
  cid?: string
  sha256?: string
  issuedBy?: string
  issuedAt?: string
  expiresAt?: string
  notes?: string
}

interface PresignPayload {
  name: string
  contentType?: string
  docType?: string
}

interface DocumentUpdatePayload {
  docType?: string
  url?: string
  cid?: string
  sha256?: string
  issuedBy?: string
  issuedAt?: string
  expiresAt?: string
  notes?: string
  isValid?: boolean
}

interface OrderDocumentPayload {
  docType: string
  storageProvider: string
  url?: string
  cid?: string
  sha256?: string
  uploadedBy?: string
  uploadedAt?: string
  notes?: string
}

interface OrderDocumentUpdatePayload {
  docType?: string
  url?: string
  cid?: string
  sha256?: string
  uploadedBy?: string
  uploadedAt?: string
  notes?: string
  isValid?: boolean
}

interface PricePayload {
  amountMinor: number
  currency: string
}

interface OrderPayload {
  buyerWallet?: string
  agentId?: string
  commodity?: string
  origin?: string
  destination?: string
  status?: string
  price?: PricePayload
  weightKg?: number
  pickupAt?: string
  deliveryBy?: string
  deliveryInstructions?: string
  manifestUrl?: string
  documents?: OrderDocumentPayload[]
}

interface ManifestFilePayload {
  documentId?: string
  name: string
  docType: string
  sha256: string
  href: string
}

interface ManifestPayload {
  files: ManifestFilePayload[]
}

interface VerifyQueue {
  send: (body: unknown) => Promise<void>
}

interface Env {
  DB: D1Database
  BUNDLES: R2Bucket
  ALLOWED_ORIGIN?: string
  TURNSTILE_SECRET_KEY?: string
  VERIFY_QUEUE?: VerifyQueue
}

const ACCESS_CONTROL_HEADERS = 'content-type, cf-turnstile-token, authorization'

function jsonResponse(data: unknown, status = 200, cors = '*') {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': cors,
      'access-control-allow-headers': ACCESS_CONTROL_HEADERS,
      'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS'
    }
  })
}

async function verifyTurnstile(secret: string | undefined, token: string | null): Promise<boolean> {
  if (!secret) {
    return true
  }
  if (!token) return false

  const params = new URLSearchParams({
    secret,
    response: token
  })

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: params
    })
    if (!res.ok) {
      return false
    }
    const outcome = (await res.json()) as { success?: boolean }
    return Boolean(outcome.success)
  } catch (error) {
    console.error('turnstile_verify_failed', error)
    return false
  }
}

function normaliseCsv(value?: string | string[]): string | null {
  if (value == null) return null
  if (Array.isArray(value)) {
    return (
      value
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
        .join(',') || null
    )
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function parseBoolean(value: unknown, fallback = false): number {
  if (typeof value === 'boolean') return value ? 1 : 0
  if (typeof value === 'number') return value ? 1 : 0
  if (typeof value === 'string') {
    const normalised = value.trim().toLowerCase()
    if (['1', 'true', 'yes', 'y'].includes(normalised)) return 1
    if (['0', 'false', 'no', 'n'].includes(normalised)) return 0
  }
  return fallback ? 1 : 0
}

function validateAgentDocuments(documents: DocumentPayload[] | undefined) {
  if (!documents) return []

  return documents.map((doc) => {
    if (!AGENT_DOC_TYPES.has(doc.docType)) {
      throw new Error(`invalid_doc_type:${doc.docType}`)
    }
    if (!STORAGE_PROVIDERS.has(doc.storageProvider)) {
      throw new Error(`invalid_storage_provider:${doc.storageProvider}`)
    }
    return doc
  })
}

function validateOrderDocuments(documents: OrderDocumentPayload[] | undefined) {
  if (!documents) return []

  return documents.map((doc) => {
    if (!ORDER_DOC_TYPES.has(doc.docType)) {
      throw new Error(`invalid_order_doc_type:${doc.docType}`)
    }
    if (!STORAGE_PROVIDERS.has(doc.storageProvider)) {
      throw new Error(`invalid_storage_provider:${doc.storageProvider}`)
    }
    return doc
  })
}

function getCorsOrigin(env: Env) {
  return env.ALLOWED_ORIGIN || '*'
}

function normaliseStatus(status: string | undefined): string {
  if (!status) return 'Created'
  const trimmed = status.trim()
  if (ORDER_STATUSES.has(trimmed)) return trimmed
  throw new Error(`invalid_order_status:${status}`)
}

function parsePrice(price: PricePayload | undefined): { amount: number | null; currency: string | null } {
  if (!price) return { amount: null, currency: null }
  if (typeof price.amountMinor !== 'number' || Number.isNaN(price.amountMinor)) {
    throw new Error('invalid_price_amount')
  }
  const amount = Math.round(price.amountMinor)
  const currency = price.currency?.trim()
  if (!currency) {
    throw new Error('invalid_price_currency')
  }
  return { amount, currency }
}

function parseWeight(weight: number | undefined): number | null {
  if (weight == null) return null
  if (typeof weight !== 'number' || Number.isNaN(weight)) {
    throw new Error('invalid_weight')
  }
  return Math.max(0, Math.round(weight))
}

async function createAgent(env: Env, body: AgentPayload, cors: string, turnstileToken: string | null) {
  const isTurnstileValid = await verifyTurnstile(env.TURNSTILE_SECRET_KEY, turnstileToken)
  if (!isTurnstileValid) {
    return jsonResponse({ error: 'turnstile_failed' }, 403, cors)
  }

  if (!body.walletAddress || !body.legalName) {
    return jsonResponse({ error: 'missing_fields' }, 422, cors)
  }

  const id = ulid()
  const status = 'submitted'
  const operatingRegions = normaliseCsv(body.operatingRegions)
  const certifications = normaliseCsv(body.certifications)
  const coldChainCapable = parseBoolean(body.coldChainCapable)
  const riskScoreBps = Number.isInteger(body.riskScoreBps) ? body.riskScoreBps : 10000

  const insertAgent = env.DB.prepare(
    `INSERT INTO agents (
        id, wallet_address, legal_name, base_location, compliance_contact, cold_chain_capable,
        fleet_details, insurance_provider, operating_regions, certifications,
        proof_bundle_url, proof_bundle_cid, status, risk_score_bps, fee_schedule_cid
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)`
  )

  await insertAgent
    .bind(
      id,
      body.walletAddress.trim(),
      body.legalName.trim(),
      body.baseLocation ?? null,
      body.complianceContact ?? null,
      coldChainCapable,
      body.fleetDetails ?? null,
      body.insuranceProvider ?? null,
      operatingRegions,
      certifications,
      body.proofBundleUrl ?? null,
      body.proofBundleCid ?? null,
      status,
      riskScoreBps,
      body.feeScheduleCid ?? null
    )
    .run()

  let documents: DocumentPayload[]
  try {
    documents = validateAgentDocuments(body.documents)
  } catch (error) {
    console.warn('agent_documents_invalid', error)
    return jsonResponse({ error: 'invalid_documents' }, 422, cors)
  }
  if (documents.length > 0) {
    const statements = documents.map((doc) =>
      env.DB.prepare(
        `INSERT INTO agent_documents (
            id, agent_id, doc_type, storage_provider, url, cid, sha256, issued_by, issued_at, expires_at, notes
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`
      ).bind(
        ulid(),
        id,
        doc.docType,
        doc.storageProvider,
        doc.url ?? null,
        doc.cid ?? null,
        doc.sha256 ?? null,
        doc.issuedBy ?? null,
        doc.issuedAt ?? null,
        doc.expiresAt ?? null,
        doc.notes ?? null
      )
    )
    await env.DB.batch(statements)

    if (env.VERIFY_QUEUE) {
      for (const statement of documents) {
        await env.VERIFY_QUEUE.send({ agentId: id, docType: statement.docType, cid: statement.cid, url: statement.url })
      }
    }
  }

  return jsonResponse({ id, status }, 201, cors)
}

async function createOrder(env: Env, body: OrderPayload, cors: string, turnstileToken: string | null) {
  const isTurnstileValid = await verifyTurnstile(env.TURNSTILE_SECRET_KEY, turnstileToken)
  if (!isTurnstileValid) {
    return jsonResponse({ error: 'turnstile_failed' }, 403, cors)
  }

  if (!body.buyerWallet || !body.commodity || !body.origin || !body.destination) {
    return jsonResponse({ error: 'missing_fields' }, 422, cors)
  }

  const buyerWallet = body.buyerWallet.trim()
  const commodity = body.commodity.trim()
  const origin = body.origin.trim()
  const destination = body.destination.trim()

  if (!buyerWallet || !commodity || !origin || !destination) {
    return jsonResponse({ error: 'missing_fields' }, 422, cors)
  }

  const id = ulid()
  let status: string
  try {
    status = normaliseStatus(body.status)
  } catch (error) {
    console.warn('order_status_invalid', error)
    return jsonResponse({ error: 'invalid_status' }, 422, cors)
  }
  let priceAmount: number | null
  let priceCurrency: string | null
  let weightKg: number | null
  try {
    ;({ amount: priceAmount, currency: priceCurrency } = parsePrice(body.price))
    weightKg = parseWeight(body.weightKg)
  } catch (error) {
    console.warn('order_payload_invalid', error)
    return jsonResponse({ error: 'invalid_payload' }, 422, cors)
  }

  await env.DB.prepare(
    `INSERT INTO orders (
        id, buyer_wallet, agent_id, commodity, origin, destination, status,
        price_amount, price_currency, weight_kg, pickup_at, delivery_by, delivery_instructions, manifest_url
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)`
  )
    .bind(
      id,
      buyerWallet,
      body.agentId?.trim() || null,
      commodity,
      origin,
      destination,
      status,
      priceAmount,
      priceCurrency,
      weightKg,
      body.pickupAt ?? null,
      body.deliveryBy ?? null,
      body.deliveryInstructions ?? null,
      body.manifestUrl ?? null
    )
    .run()

  await env.DB.prepare(
    `INSERT INTO order_events (id, order_id, status, note, actor_wallet)
     VALUES (?1, ?2, ?3, ?4, ?5)`
  )
    .bind(ulid(), id, status, 'Order created', buyerWallet)
    .run()

  let documents: OrderDocumentPayload[]
  try {
    documents = validateOrderDocuments(body.documents)
  } catch (error) {
    console.warn('order_documents_invalid', error)
    return jsonResponse({ error: 'invalid_documents' }, 422, cors)
  }
  if (documents.length > 0) {
    const statements = documents.map((doc) =>
      env.DB.prepare(
        `INSERT INTO order_documents (id, order_id, doc_type, storage_provider, url, cid, sha256, uploaded_by, uploaded_at, notes)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`
      ).bind(
        ulid(),
        id,
        doc.docType,
        doc.storageProvider,
        doc.url ?? null,
        doc.cid ?? null,
        doc.sha256 ?? null,
        doc.uploadedBy ?? null,
        doc.uploadedAt ?? null,
        doc.notes ?? null
      )
    )
    await env.DB.batch(statements)

    if (env.VERIFY_QUEUE) {
      for (const doc of documents) {
        await env.VERIFY_QUEUE.send({ orderId: id, docType: doc.docType, cid: doc.cid, url: doc.url })
      }
    }
  }

  return jsonResponse({ id, status }, 201, cors)
}

async function ensureAgentExists(env: Env, agentId: string): Promise<boolean> {
  const row = await env.DB.prepare('SELECT id FROM agents WHERE id = ?1').bind(agentId).first()
  return Boolean(row)
}

async function ensureOrderExists(env: Env, orderId: string): Promise<boolean> {
  const row = await env.DB.prepare('SELECT id FROM orders WHERE id = ?1').bind(orderId).first()
  return Boolean(row)
}

async function createPresignedAgentUpload(env: Env, agentId: string, payload: PresignPayload, cors: string) {
  if (!payload?.name) {
    return jsonResponse({ error: 'missing_file_name' }, 422, cors)
  }

  if (!(await ensureAgentExists(env, agentId))) {
    return jsonResponse({ error: 'agent_not_found' }, 404, cors)
  }

  const docType = payload.docType && AGENT_DOC_TYPES.has(payload.docType) ? payload.docType : 'other'

  const key = `agents/${agentId}/${ulid()}-${payload.name}`
  const putUrl = await env.BUNDLES.createSignedUrl(key, {
    method: 'PUT',
    expiration: 900,
    customHeaders: {
      'content-type': payload.contentType ?? 'application/octet-stream'
    }
  })

  const getUrl = await env.BUNDLES.createSignedUrl(key, {
    method: 'GET',
    expiration: 7 * 24 * 60 * 60
  })

  const documentId = ulid()
  await env.DB.prepare(
    `INSERT INTO agent_documents (id, agent_id, doc_type, storage_provider, url, notes)
     VALUES (?1, ?2, ?3, 'r2', ?4, 'pending_upload')`
  )
    .bind(documentId, agentId, docType, getUrl.toString())
    .run()

  if (env.VERIFY_QUEUE) {
    await env.VERIFY_QUEUE.send({ agentId, documentId, key })
  }

  return jsonResponse({ documentId, putUrl: putUrl.toString(), getUrl: getUrl.toString(), key, docType }, 200, cors)
}

async function createPresignedOrderUpload(env: Env, orderId: string, payload: PresignPayload, cors: string) {
  if (!payload?.name) {
    return jsonResponse({ error: 'missing_file_name' }, 422, cors)
  }

  if (!(await ensureOrderExists(env, orderId))) {
    return jsonResponse({ error: 'order_not_found' }, 404, cors)
  }

  const docType = payload.docType && ORDER_DOC_TYPES.has(payload.docType) ? payload.docType : 'other'

  const key = `orders/${orderId}/${ulid()}-${payload.name}`
  const putUrl = await env.BUNDLES.createSignedUrl(key, {
    method: 'PUT',
    expiration: 900,
    customHeaders: {
      'content-type': payload.contentType ?? 'application/octet-stream'
    }
  })

  const getUrl = await env.BUNDLES.createSignedUrl(key, {
    method: 'GET',
    expiration: 7 * 24 * 60 * 60
  })

  const documentId = ulid()
  await env.DB.prepare(
    `INSERT INTO order_documents (id, order_id, doc_type, storage_provider, url, notes)
     VALUES (?1, ?2, ?3, 'r2', ?4, 'pending_upload')`
  )
    .bind(documentId, orderId, docType, getUrl.toString())
    .run()

  if (env.VERIFY_QUEUE) {
    await env.VERIFY_QUEUE.send({ orderId, documentId, key })
  }

  return jsonResponse({ documentId, putUrl: putUrl.toString(), getUrl: getUrl.toString(), key, docType }, 200, cors)
}

async function updateAgentDocument(env: Env, agentId: string, documentId: string, body: DocumentUpdatePayload, cors: string) {
  const updates: string[] = []
  const values: unknown[] = []

  if (body.docType) {
    if (!AGENT_DOC_TYPES.has(body.docType)) {
      return jsonResponse({ error: 'invalid_doc_type' }, 422, cors)
    }
    updates.push('doc_type = ?')
    values.push(body.docType)
  }
  if (body.url) {
    updates.push('url = ?')
    values.push(body.url)
  }
  if (body.cid) {
    updates.push('cid = ?')
    values.push(body.cid)
  }
  if (body.sha256) {
    updates.push('sha256 = ?')
    values.push(body.sha256)
  }
  if (body.issuedBy) {
    updates.push('issued_by = ?')
    values.push(body.issuedBy)
  }
  if (body.issuedAt) {
    updates.push('issued_at = ?')
    values.push(body.issuedAt)
  }
  if (body.expiresAt) {
    updates.push('expires_at = ?')
    values.push(body.expiresAt)
  }
  if (body.notes) {
    updates.push('notes = ?')
    values.push(body.notes)
  }
  if (typeof body.isValid === 'boolean') {
    updates.push('is_valid = ?')
    values.push(body.isValid ? 1 : 0)
  }

  if (!updates.length) {
    return jsonResponse({ updated: 0 }, 200, cors)
  }


  const statement = `UPDATE agent_documents SET ${updates.join(', ')} WHERE id = ? AND agent_id = ?`
  values.push(documentId, agentId)

  const result = await env.DB.prepare(statement).bind(...values).run()
  return jsonResponse({ updated: result.success ? result.meta.changes : 0 }, 200, cors)
}

async function updateOrderDocument(env: Env, orderId: string, documentId: string, body: OrderDocumentUpdatePayload, cors: string) {
  const updates: string[] = []
  const values: unknown[] = []

  if (body.docType) {
    if (!ORDER_DOC_TYPES.has(body.docType)) {
      return jsonResponse({ error: 'invalid_doc_type' }, 422, cors)
    }
    updates.push('doc_type = ?')
    values.push(body.docType)
  }
  if (body.url) {
    updates.push('url = ?')
    values.push(body.url)
  }
  if (body.cid) {
    updates.push('cid = ?')
    values.push(body.cid)
  }
  if (body.sha256) {
    updates.push('sha256 = ?')
    values.push(body.sha256)
  }
  if (body.uploadedBy) {
    updates.push('uploaded_by = ?')
    values.push(body.uploadedBy)
  }
  if (body.uploadedAt) {
    updates.push('uploaded_at = ?')
    values.push(body.uploadedAt)
  }
  if (body.notes) {
    updates.push('notes = ?')
    values.push(body.notes)
  }
  if (typeof body.isValid === 'boolean') {
    updates.push('is_valid = ?')
    values.push(body.isValid ? 1 : 0)
  }

  if (!updates.length) {
    return jsonResponse({ updated: 0 }, 200, cors)
  }

  const statement = `UPDATE order_documents SET ${updates.join(', ')} WHERE id = ? AND order_id = ?`
  values.push(documentId, orderId)

  const result = await env.DB.prepare(statement).bind(...values).run()
  return jsonResponse({ updated: result.success ? result.meta.changes : 0 }, 200, cors)
}

function formatOrderRow(row: any) {
  const amount = typeof row.price_amount === 'number' ? row.price_amount : null
  const currency = row.price_currency ?? null
  const price = amount != null && currency ? `${(amount / 100).toFixed(2)} ${currency}` : '—'
  return {
    id: row.id,
    buyer: row.buyer_wallet,
    agent: row.agent_id,
    commodity: row.commodity,
    origin: row.origin,
    destination: row.destination,
    status: row.status,
    price,
    updatedAt: Math.floor(new Date(row.updated_at).getTime() / 1000)
  }
}

async function listOrdersByWallet(env: Env, wallet: string) {
  const result = await env.DB.prepare(
    `SELECT id, buyer_wallet, agent_id, commodity, origin, destination, status, price_amount, price_currency, updated_at
     FROM orders WHERE buyer_wallet = ?1 ORDER BY updated_at DESC`
  )
    .bind(wallet)
    .all()

  const orders = (result.results || []).map(formatOrderRow)
  return orders
}

function formatAgentRow(row: any) {
  return {
    id: row.id,
    wallet: row.wallet_address,
    legalName: row.legal_name,
    baseLocation: row.base_location,
    complianceContact: row.compliance_contact,
    coldChainCapable: Boolean(row.cold_chain_capable),
    fleetDetails: row.fleet_details,
    insuranceProvider: row.insurance_provider,
    operatingRegions: row.operating_regions,
    certifications: row.certifications,
    proofBundleUrl: row.proof_bundle_url,
    status: row.status,
    riskScoreBps: row.risk_score_bps,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

async function listAgents(env: Env) {
  const result = await env.DB.prepare(
    `SELECT id, wallet_address, legal_name, base_location, compliance_contact, cold_chain_capable, fleet_details,
            insurance_provider, operating_regions, certifications, proof_bundle_url, status, risk_score_bps, created_at, updated_at
       FROM agents ORDER BY created_at DESC`
  ).all()
  return (result.results || []).map(formatAgentRow)
}

async function fetchAgentById(env: Env, agentId: string) {
  const row = await env.DB.prepare(
    `SELECT id, wallet_address, legal_name, base_location, compliance_contact, cold_chain_capable, fleet_details,
            insurance_provider, operating_regions, certifications, proof_bundle_url, status, risk_score_bps, created_at, updated_at
       FROM agents WHERE id = ?1`
  )
    .bind(agentId)
    .first()
  return row ? formatAgentRow(row) : null
}

async function fetchAgentByWallet(env: Env, wallet: string) {
  const row = await env.DB.prepare(
    `SELECT id, wallet_address, legal_name, base_location, compliance_contact, cold_chain_capable, fleet_details,
            insurance_provider, operating_regions, certifications, proof_bundle_url, status, risk_score_bps, created_at, updated_at
       FROM agents WHERE wallet_address = ?1`
  )
    .bind(wallet)
    .first()
  return row ? formatAgentRow(row) : null
}

async function listAgentDocuments(env: Env, agentId: string) {
  const result = await env.DB.prepare(
    `SELECT id, agent_id, doc_type, storage_provider, url, cid, sha256, issued_by, issued_at, expires_at, is_valid, notes
       FROM agent_documents WHERE agent_id = ?1`
  )
    .bind(agentId)
    .all()
  return result.results || []
}

async function listOrderEvents(env: Env, orderId: string) {
  const result = await env.DB.prepare(
    `SELECT status, note, created_at FROM order_events WHERE order_id = ?1 ORDER BY created_at ASC`
  )
    .bind(orderId)
    .all()
  return (result.results || []).map((row) => ({
    status: row.status,
    note: row.note,
    at: Math.floor(new Date(row.created_at).getTime() / 1000)
  }))
}

async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(input))
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function storeAgentManifest(env: Env, agentId: string, payload: ManifestPayload, cors: string) {
  if (!payload?.files || !Array.isArray(payload.files) || payload.files.length === 0) {
    return jsonResponse({ error: 'empty_manifest' }, 422, cors)
  }

  const files = payload.files.map((file) => ({
    documentId: file.documentId ?? null,
    name: file.name,
    docType: file.docType,
    sha256: file.sha256,
    href: file.href
  }))

  const manifest = {
    agentId,
    version: 1,
    generatedAt: new Date().toISOString(),
    files
  }

  const manifestJson = JSON.stringify(manifest, null, 2)
  const manifestKey = `agents/${agentId}/manifest-${Date.now()}.json`
  await env.BUNDLES.put(manifestKey, manifestJson, {
    httpMetadata: {
      contentType: 'application/json'
    }
  })

  const manifestHash = await sha256Hex(manifestJson)

  await env.DB.prepare('UPDATE agents SET proof_bundle_url = ?1, proof_bundle_cid = ?2 WHERE id = ?3')
    .bind(manifestKey, manifestHash, agentId)
    .run()

  return jsonResponse({ manifestUrl: manifestKey, sha256: manifestHash }, 201, cors)
}

async function fetchAgentManifest(env: Env, agentId: string, cors: string) {
  const row = await env.DB.prepare('SELECT proof_bundle_url FROM agents WHERE id = ?1').bind(agentId).first()
  if (!row || !row.proof_bundle_url) {
    return jsonResponse({ error: 'manifest_not_found' }, 404, cors)
  }
  const object = await env.BUNDLES.get(row.proof_bundle_url)
  if (!object) {
    return jsonResponse({ error: 'manifest_not_found' }, 404, cors)
  }
  const body = await object.text()
  return new Response(body, {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': cors
    }
  })
}

function handleOptions(cors: string, request: Request) {
  const requestHeaders = request.headers.get('Access-Control-Request-Headers') || ACCESS_CONTROL_HEADERS
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': cors,
      'access-control-allow-headers': requestHeaders,
      'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS'
    }
  })
}

function handleNotFound(cors: string) {
  return jsonResponse({ error: 'not_found' }, 404, cors)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cors = getCorsOrigin(env)

    if (request.method === 'OPTIONS') {
      return handleOptions(cors, request)
    }

    const url = new URL(request.url)

    try {
      if (request.method === 'POST' && url.pathname === '/agents') {
        const body = (await request.json()) as AgentPayload
        const turnstileToken = request.headers.get('cf-turnstile-token')
        return await createAgent(env, body, cors, turnstileToken)
      }

      if (request.method === 'POST' && url.pathname === '/orders') {
        const body = (await request.json()) as OrderPayload
        const turnstileToken = request.headers.get('cf-turnstile-token')
        return await createOrder(env, body, cors, turnstileToken)
      }

      if (request.method === 'POST' && url.pathname.startsWith('/agents/') && url.pathname.endsWith('/presign')) {
        const [, resource, agentId] = url.pathname.split('/')
        if (resource !== 'agents' || !agentId) {
          return handleNotFound(cors)
        }
        const payload = (await request.json()) as PresignPayload
        return await createPresignedAgentUpload(env, agentId, payload, cors)
      }

      if (request.method === 'POST' && url.pathname.startsWith('/orders/') && url.pathname.endsWith('/presign')) {
        const [, resource, orderId] = url.pathname.split('/')
        if (resource !== 'orders' || !orderId) {
          return handleNotFound(cors)
        }
        const payload = (await request.json()) as PresignPayload
        return await createPresignedOrderUpload(env, orderId, payload, cors)
      }

      if (request.method === 'PATCH' && url.pathname.startsWith('/agents/') && url.pathname.includes('/documents/')) {
        const [, resource, agentId, , documentId] = url.pathname.split('/')
        if (resource !== 'agents' || !agentId || !documentId) {
          return handleNotFound(cors)
        }
        const payload = (await request.json()) as DocumentUpdatePayload
        return await updateAgentDocument(env, agentId, documentId, payload, cors)
      }

      if (request.method === 'PATCH' && url.pathname.startsWith('/orders/') && url.pathname.includes('/documents/')) {
        const [, resource, orderId, , documentId] = url.pathname.split('/')
        if (resource !== 'orders' || !orderId || !documentId) {
          return handleNotFound(cors)
        }
        const payload = (await request.json()) as OrderDocumentUpdatePayload
        return await updateOrderDocument(env, orderId, documentId, payload, cors)
      }

      if (request.method === 'POST' && url.pathname.startsWith('/agents/') && url.pathname.endsWith('/manifest')) {
        const [, resource, agentId] = url.pathname.split('/')
        if (resource !== 'agents' || !agentId) {
          return handleNotFound(cors)
        }
        const payload = (await request.json()) as ManifestPayload
        return await storeAgentManifest(env, agentId, payload, cors)
      }

      if (request.method === 'GET' && url.pathname === '/orders') {
        const wallet = url.searchParams.get('wallet')
        if (!wallet) {
          return jsonResponse({ error: 'wallet_required' }, 400, cors)
        }
        const orders = await listOrdersByWallet(env, wallet)
        return jsonResponse({ orders }, 200, cors)
      }

      if (request.method === 'GET' && url.pathname.startsWith('/orders/') && url.pathname.endsWith('/events')) {
        const [, resource, orderId] = url.pathname.split('/')
        if (resource !== 'orders' || !orderId) {
          return handleNotFound(cors)
        }
        const events = await listOrderEvents(env, orderId)
        return jsonResponse({ events }, 200, cors)
      }

      if (request.method === 'GET' && url.pathname.startsWith('/agents/') && url.pathname.endsWith('/manifest')) {
        const [, resource, agentId] = url.pathname.split('/')
        if (resource !== 'agents' || !agentId) {
          return handleNotFound(cors)
        }
        return await fetchAgentManifest(env, agentId, cors)
      }

      if (request.method === 'GET' && url.pathname === '/agents') {
        const agents = await listAgents(env)
        return jsonResponse({ agents }, 200, cors)
      }

      if (request.method === 'GET' && url.pathname.startsWith('/agents/by-wallet/')) {
        const [, , , wallet] = url.pathname.split('/')
        if (!wallet) {
          return handleNotFound(cors)
        }
        const agent = await fetchAgentByWallet(env, decodeURIComponent(wallet))
        if (!agent) {
          return jsonResponse({ agent: null }, 200, cors)
        }
        return jsonResponse({ agent }, 200, cors)
      }

      if (request.method === 'GET' && url.pathname.startsWith('/agents/') && !url.pathname.endsWith('/manifest')) {
        const [, resource, agentId] = url.pathname.split('/')
        if (resource !== 'agents' || !agentId) {
          return handleNotFound(cors)
        }
        const agent = await fetchAgentById(env, agentId)
        if (!agent) {
          return handleNotFound(cors)
        }
        const documents = await listAgentDocuments(env, agentId)
        return jsonResponse({ agent, documents }, 200, cors)
      }
    } catch (error) {
      console.error('request_failed', error)
      return jsonResponse({ error: 'internal_error' }, 500, cors)
    }

    return handleNotFound(cors)
  }
}
