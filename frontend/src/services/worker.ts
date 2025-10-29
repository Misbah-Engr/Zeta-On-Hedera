const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') || 'http://localhost:8787'

interface AgentRequest {
  walletAddress: string
  legalName: string
  baseLocation?: string
  complianceContact?: string
  coldChainCapable?: boolean
  fleetDetails?: string
  insuranceProvider?: string
  operatingRegions?: string[]
  certifications?: string[]
  proofBundleUrl?: string
  proofBundleCid?: string
}

interface OrderRequest {
  buyerWallet: string
  agentId?: string
  commodity: string
  origin: string
  destination: string
  priceMinor?: number
  priceCurrency?: string
  weightKg?: number
  pickupAt?: string
  deliveryBy?: string
  deliveryInstructions?: string
  manifestUrl?: string
}

interface PresignRequest {
  name: string
  contentType?: string
  docType?: string
}

interface ManifestFile {
  documentId?: string | null
  name: string
  docType: string
  sha256: string
  href: string
}

async function apiFetch<T>(path: string, init: RequestInit & { turnstileToken?: string } = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('content-type', 'application/json')
  if (init.turnstileToken) {
    headers.set('cf-turnstile-token', init.turnstileToken)
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers
  })

  if (!response.ok) {
    let error: any = { status: response.status, message: response.statusText }
    try {
      error = await response.json()
    } catch (err) {
      // ignore json parse errors
    }
    throw error
  }

  if (response.headers.get('content-type')?.includes('application/json')) {
    return (await response.json()) as T
  }
  return (await response.text()) as unknown as T
}

export async function submitAgent(payload: AgentRequest, turnstileToken?: string) {
  return apiFetch<{ id: string; status: string }>('/agents', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      operatingRegions: payload.operatingRegions,
      certifications: payload.certifications
    }),
    turnstileToken
  })
}

export async function presignAgentDocument(agentId: string, payload: PresignRequest) {
  return apiFetch<{ documentId: string; putUrl: string; getUrl: string; key: string; docType: string }>(`/agents/${agentId}/presign`, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function updateAgentDocument(agentId: string, documentId: string, payload: Record<string, unknown>) {
  return apiFetch<{ updated: number }>(`/agents/${agentId}/documents/${documentId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  })
}

export async function uploadAgentManifest(agentId: string, files: ManifestFile[]) {
  return apiFetch<{ manifestUrl: string; sha256: string }>(`/agents/${agentId}/manifest`, {
    method: 'POST',
    body: JSON.stringify({ files })
  })
}

export async function fetchAgent(agentId: string) {
  return apiFetch<{ agent: any; documents: any[] }>(`/agents/${agentId}`, {
    method: 'GET'
  })
}

export async function fetchAgents() {
  return apiFetch<{ agents: any[] }>('/agents', { method: 'GET' })
}

export async function fetchAgentByWallet(wallet: string) {
  return apiFetch<{ agent: any | null }>(`/agents/by-wallet/${encodeURIComponent(wallet)}`, {
    method: 'GET'
  })
}

export async function createOrder(payload: OrderRequest, turnstileToken?: string) {
  const body: any = {
    buyerWallet: payload.buyerWallet,
    agentId: payload.agentId || null,
    commodity: payload.commodity,
    origin: payload.origin,
    destination: payload.destination,
    status: 'Created',
    price: payload.priceMinor != null && payload.priceCurrency
      ? { amountMinor: payload.priceMinor, currency: payload.priceCurrency }
      : undefined,
    weightKg: payload.weightKg,
    pickupAt: payload.pickupAt,
    deliveryBy: payload.deliveryBy,
    deliveryInstructions: payload.deliveryInstructions,
    manifestUrl: payload.manifestUrl
  }
  return apiFetch<{ id: string; status: string }>('/orders', {
    method: 'POST',
    body: JSON.stringify(body),
    turnstileToken
  })
}

export async function fetchOrders(wallet: string) {
  return apiFetch<{ orders: any[] }>(`/orders?wallet=${encodeURIComponent(wallet)}`, {
    method: 'GET'
  })
}

export async function fetchOrderEvents(orderId: string) {
  return apiFetch<{ events: any[] }>(`/orders/${orderId}/events`, {
    method: 'GET'
  })
}
