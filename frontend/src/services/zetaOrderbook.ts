import { useCallback } from 'react'
import { Agent, AgentAd, AgentAvailability, AgentProfile, Dispute, Order, OrderLifecycleEvent } from '../types/order'
import { fetchAgent, fetchAgentByWallet, fetchAgents, fetchOrderEvents, fetchOrders } from './worker'

const DEFAULT_AVATAR = 'https://avatars.dicebear.com/api/identicon/zeta.svg'

function toOrder(row: any): Order {
  return {
    id: row.id,
    buyer: row.buyer,
    agent: row.agent ?? '',
    commodity: row.commodity,
    origin: row.origin,
    destination: row.destination,
    status: row.status,
    price: row.price,
    updatedAt: row.updatedAt
  }
}

function toAgent(adapted: any): Agent {
  return {
    id: adapted.id,
    handle: adapted.legalName || adapted.id,
    avatar: DEFAULT_AVATAR,
    baseLocation: adapted.baseLocation || '—',
    rating: 4.5,
    completedDeliveries: 0,
    disputedDeliveries: 0
  }
}

function toAd(agent: any): AgentAd {
  const availability: AgentAvailability = agent.status === 'approved' ? 'Available' : agent.status === 'submitted' ? 'Queueing' : 'Unavailable'
  return {
    id: `ad-${agent.id}`,
    agentId: agent.id,
    commodity: agent.certifications ? `Certified: ${agent.certifications}` : 'General logistics capacity',
    location: agent.operatingRegions ? `${agent.baseLocation ?? 'Global'} • Regions: ${agent.operatingRegions}` : agent.baseLocation ?? 'Global network',
    price: agent.feeScheduleCid ? `Fee schedule: ${agent.feeScheduleCid}` : 'Quote on request',
    minWeight: agent.coldChainCapable ? 1 : 0,
    maxWeight: agent.coldChainCapable ? 1000 : 250,
    availability
  }
}

function toProfile(agent: any): AgentProfile {
  const baseAgent = toAgent(agent)
  return {
    ...baseAgent,
    handle: agent.legalName,
    bio: agent.fleetDetails || 'Specialised Hedera-enabled fulfilment agent.',
    baseLocation: agent.baseLocation || '—'
  }
}

function toTimeline(events: any[]): OrderLifecycleEvent[] {
  return events.map((event) => ({
    status: event.status,
    note: event.note,
    at: event.at
  }))
}

export const useOrderbookApi = () => {
  const fetchOrdersForAccount = useCallback(async (account: string): Promise<Order[]> => {
    if (!account) return []
    try {
      const { orders } = await fetchOrders(account)
      return orders.map(toOrder)
    } catch (error) {
      console.warn('orders_fallback', error)
      return []
    }
  }, [])

  const fetchActiveAds = useCallback(async (): Promise<AgentAd[]> => {
    try {
      const { agents } = await fetchAgents()
      return agents.map(toAd)
    } catch (error) {
      console.warn('ads_fallback', error)
      return []
    }
  }, [])

  const fetchAgentProfile = useCallback(async (agentId: string): Promise<AgentProfile> => {
    try {
      const { agent } = await fetchAgent(agentId)
      return toProfile(agent)
    } catch (error) {
      console.warn('agent_profile_fallback', error)
      return {
        id: agentId,
        handle: agentId,
        avatar: DEFAULT_AVATAR,
        baseLocation: '—',
        rating: 4.5,
        completedDeliveries: 0,
        disputedDeliveries: 0,
        bio: 'Profile not found'
      }
    }
  }, [])

  const fetchAgentAds = useCallback(async (agentId: string): Promise<AgentAd[]> => {
    try {
      const { agent } = await fetchAgent(agentId)
      if (!agent) return []
      return [toAd(agent)]
    } catch (error) {
      console.warn('agent_ads_fallback', error)
      return []
    }
  }, [])

  const fetchOrderTimeline = useCallback(async (orderId: string): Promise<OrderLifecycleEvent[]> => {
    try {
      const { events } = await fetchOrderEvents(orderId)
      return toTimeline(events)
    } catch (error) {
      console.warn('order_timeline_fallback', error)
      return []
    }
  }, [])

  const fetchDispute = useCallback(async (_orderId: string): Promise<Dispute | undefined> => {
    return undefined
  }, [])

  const fetchAgentStatusByWallet = useCallback(async (wallet: string) => {
    if (!wallet) return null
    const { agent } = await fetchAgentByWallet(wallet)
    return agent
  }, [])

  return {
    fetchOrdersForAccount,
    fetchActiveAds,
    fetchAgentProfile,
    fetchAgentAds,
    fetchOrderTimeline,
    fetchDispute,
    fetchAgentStatusByWallet
  }
}
