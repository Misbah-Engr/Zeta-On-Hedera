import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { TurnstileWidget } from '../components/TurnstileWidget'
import { useOrderbookApi } from '../services/zetaOrderbook'
import { createOrder } from '../services/worker'
import { Order } from '../types/order'
import { useAccount } from 'wagmi'
import './PageStyles.css'

const statusBadgeClass = (status: Order['status']) => `badge badge-${status.toLowerCase()}`

const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined

const OrdersPage = () => {
  const { address: accountId } = useAccount()
  const { fetchOrdersForAccount } = useOrderbookApi()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [formState, setFormState] = useState({
    commodity: '',
    origin: '',
    destination: '',
    priceMinor: '',
    priceCurrency: 'USDC',
    weightKg: '',
    deliveryInstructions: ''
  })
  const [turnstileToken, setTurnstileToken] = useState<string | null>(turnstileSiteKey ? null : 'dev-bypass')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!accountId) {
      setOrders([])
      return
    }
    let isMounted = true
    const load = async () => {
      setLoading(true)
      try {
        const result = await fetchOrdersForAccount(accountId)
        if (isMounted) setOrders(result)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [accountId, fetchOrdersForAccount])

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => b.updatedAt - a.updatedAt)
  }, [orders])

  const handleChange = (field: string, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault()
    if (!accountId) {
      setError('Connect your wallet to create an order')
      return
    }
    if (turnstileSiteKey && !turnstileToken) {
      setError('Complete the Turnstile challenge to submit an order')
      return
    }
    try {
      setCreating(true)
      setError(null)
      const priceMinor = formState.priceMinor ? Math.round(Number(formState.priceMinor) * 100) : undefined
      const weightKg = formState.weightKg ? Number(formState.weightKg) : undefined
      await createOrder(
        {
          buyerWallet: accountId,
          commodity: formState.commodity,
          origin: formState.origin,
          destination: formState.destination,
          priceMinor,
          priceCurrency: priceMinor ? formState.priceCurrency : undefined,
          weightKg,
          deliveryInstructions: formState.deliveryInstructions
        },
        turnstileToken || undefined
      )
      setFormState({ commodity: '', origin: '', destination: '', priceMinor: '', priceCurrency: 'USDC', weightKg: '', deliveryInstructions: '' })
      const refreshed = await fetchOrdersForAccount(accountId)
      setOrders(refreshed)
    } catch (err: any) {
      console.error('order_create_failed', err)
      setError(err?.error || err?.message || 'Order creation failed')
    } finally {
      setCreating(false)
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Your orders</h2>
          <p>
            Connected account:{' '}
            {accountId ? <strong>{accountId}</strong> : 'Connect HashPack to load your escrowed orders.'}
          </p>
        </div>
      </header>
      <div className="split">
        <form className="panel" onSubmit={handleCreate}>
          <h3>Create delivery order</h3>
          <div className="form-grid">
            <label>
              Commodity
              <input required value={formState.commodity} onChange={(event) => handleChange('commodity', event.target.value)} />
            </label>
            <label>
              Origin
              <input required value={formState.origin} onChange={(event) => handleChange('origin', event.target.value)} />
            </label>
            <label>
              Destination
              <input required value={formState.destination} onChange={(event) => handleChange('destination', event.target.value)} />
            </label>
            <label>
              Price (major units)
              <input
                type="number"
                min="0"
                step="0.01"
                value={formState.priceMinor}
                onChange={(event) => handleChange('priceMinor', event.target.value)}
              />
            </label>
            <label>
              Currency
              <input value={formState.priceCurrency} onChange={(event) => handleChange('priceCurrency', event.target.value)} />
            </label>
            <label>
              Weight (kg)
              <input
                type="number"
                min="0"
                step="1"
                value={formState.weightKg}
                onChange={(event) => handleChange('weightKg', event.target.value)}
              />
            </label>
            <label className="span-2">
              Delivery instructions
              <textarea
                placeholder="Add access codes, handling requirements, etc."
                value={formState.deliveryInstructions}
                onChange={(event) => handleChange('deliveryInstructions', event.target.value)}
              />
            </label>
          </div>
          {turnstileSiteKey && (
            <div className="turnstile-wrapper">
              <TurnstileWidget
                siteKey={turnstileSiteKey}
                onSuccess={(token) => setTurnstileToken(token)}
                onError={() => setTurnstileToken(null)}
              />
            </div>
          )}
          <button type="submit" disabled={creating}>
            {creating ? 'Submitting…' : 'Submit order'}
          </button>
          {error && <p className="error">{error}</p>}
        </form>
        <div className="panel">
          <h3>Recent orders</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Route</th>
                <th>Commodity</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6}>Syncing ledger…</td>
                </tr>
              )}
              {!loading && sortedOrders.length === 0 && (
                <tr>
                  <td colSpan={6}>No orders yet. Match with an agent to begin.</td>
                </tr>
              )}
              {!loading &&
                sortedOrders.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>
                      {order.origin} → {order.destination}
                    </td>
                    <td>{order.commodity}</td>
                    <td>
                      <span className={statusBadgeClass(order.status)}>{order.status}</span>
                    </td>
                    <td>{new Date(order.updatedAt * 1000).toLocaleString()}</td>
                    <td className="table-actions">
                      <Link to={`/orders/${order.id}/lifecycle`}>Lifecycle</Link>
                      <Link to={`/orders/${order.id}/dispute`}>Dispute</Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default OrdersPage
