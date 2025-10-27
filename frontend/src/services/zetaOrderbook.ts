import { useCallback } from 'react';
import { useContractActions } from './hedera';
import { Agent, AgentAd, AgentProfile, Dispute, Order, OrderLifecycleEvent } from '../types/order';
import { AccountId } from '@hashgraph/sdk';

const FALLBACK_AGENTS: Agent[] = [
  {
    id: '0.0.1001',
    handle: 'skybridge',
    avatar: 'https://i.pravatar.cc/150?img=12',
    baseLocation: 'Singapore',
    rating: 4.9,
    completedDeliveries: 182,
    disputedDeliveries: 2
  },
  {
    id: '0.0.998',
    handle: 'arcticfox',
    avatar: 'https://i.pravatar.cc/150?img=32',
    baseLocation: 'Reykjavík',
    rating: 4.7,
    completedDeliveries: 96,
    disputedDeliveries: 1
  }
];

const FALLBACK_ADS: AgentAd[] = [
  {
    id: 'ad-1',
    agentId: '0.0.1001',
    commodity: 'Lithium cells',
    location: 'Singapore → Tokyo',
    price: '1420 USDC',
    minWeight: 2,
    maxWeight: 150,
    availability: 'Available'
  },
  {
    id: 'ad-2',
    agentId: '0.0.998',
    commodity: 'Cold-chain biologics',
    location: 'Reykjavík → Frankfurt',
    price: '980 USDC',
    minWeight: 1,
    maxWeight: 80,
    availability: 'Queueing'
  }
];

const FALLBACK_ORDERS: Order[] = [
  {
    id: '501',
    buyer: '0.0.1234',
    agent: '0.0.1001',
    commodity: 'Lithium cells',
    origin: 'Singapore',
    destination: 'Tokyo',
    status: 'InTransit',
    price: '1420 USDC',
    updatedAt: 1712432923
  },
  {
    id: '502',
    buyer: '0.0.1234',
    agent: '0.0.998',
    commodity: 'Cold-chain biologics',
    origin: 'Reykjavík',
    destination: 'Frankfurt',
    status: 'Delivered',
    price: '980 USDC',
    updatedAt: 1711322923
  }
];

const FALLBACK_TIMELINE: OrderLifecycleEvent[] = [
  { status: 'Created', note: 'Escrow funded', at: 1711322923 },
  { status: 'Matched', note: 'Agent accepted assignment', at: 1711326523 },
  { status: 'InTransit', note: 'Pickup confirmed', at: 1711412923 },
  { status: 'Delivered', note: 'Drop-off signature uploaded', at: 1711499323 }
];

const FALLBACK_DISPUTE: Dispute = {
  stage: 'EvidenceSubmitted',
  claimant: '0.0.1234',
  evidence: 'Temperature logs uploaded for verification',
  resolution: ''
};

export const useOrderbookApi = () => {
  const { readContract } = useContractActions();

  const fetchOrdersForAccount = useCallback(async (account: string): Promise<Order[]> => {
    try {
      const items = await readContract({
        functionName: 'getOrdersForAccount',
        args: [account],
      }) as Array<any>;

      return items.map((item) => ({
        id: item.id.toString(),
        buyer: item.buyer,
        agent: item.agent,
        commodity: item.commodity,
        origin: item.origin,
        destination: item.destination,
        status: mapStatus(item.status),
        price: `${Number(item.price) / 100} USDC`,
        updatedAt: Number(item.updatedAt)
      }));
    } catch (error) {
      console.warn('Falling back to mocked orders', error);
      return FALLBACK_ORDERS;
    }
  }, [readContract]);

  const fetchActiveAds = useCallback(async (): Promise<AgentAd[]> => {
    try {
      const items = await readContract({
        functionName: 'getActiveAds',
      }) as Array<any>;

      return items.map((item, index) => ({
        id: `${item.agent}-${index}`,
        agentId: item.agent,
        commodity: item.commodity,
        location: item.location,
        price: `${Number(item.price) / 100} USDC`,
        minWeight: Number(item.minWeight),
        maxWeight: Number(item.maxWeight),
        availability: mapAvailability(item.availability)
      }));
    } catch (error) {
      console.warn('Falling back to mocked ads', error);
      return FALLBACK_ADS;
    }
  }, [readContract]);

  const fetchAgentProfile = useCallback(async (agent: string): Promise<AgentProfile> => {
    try {
      const profile = await readContract({
        functionName: 'getAgentProfile',
        args: [AccountId.fromString(agent).toSolidityAddress()],
      }) as any;

      return {
        id: agent,
        handle: profile.handle,
        avatar: profile.avatar,
        bio: profile.bio,
        baseLocation: profile.baseLocation,
        rating: Number(profile.rating),
        completedDeliveries: Number(profile.completedDeliveries),
        disputedDeliveries: Number(profile.disputedDeliveries)
      };
    } catch (error) {
      console.warn('Falling back to mocked agent profile', error);
      const fallback = FALLBACK_AGENTS.find((a) => a.id === agent) ?? FALLBACK_AGENTS[0];
      return { ...fallback, bio: 'Globally trusted logistics orchestrator on Hedera.' };
    }
  }, [readContract]);

  const fetchAgentAds = useCallback(async (agent: string): Promise<AgentAd[]> => {
    try {
      const items = await readContract({
        functionName: 'getAgentAds',
        args: [AccountId.fromString(agent).toSolidityAddress()],
      }) as Array<any>;

      return items.map((item, index) => ({
        id: `${agent}-${index}`,
        agentId: agent,
        commodity: item.commodity,
        location: item.location,
        price: `${Number(item.price) / 100} USDC`,
        minWeight: Number(item.minWeight),
        maxWeight: Number(item.maxWeight),
        availability: mapAvailability(item.availability)
      }));
    } catch (error) {
      console.warn('Falling back to mocked agent ads', error);
      return FALLBACK_ADS.filter((ad) => ad.agentId === agent);
    }
  }, [readContract]);

  const fetchOrderTimeline = useCallback(async (orderId: string): Promise<OrderLifecycleEvent[]> => {
    try {
      const items = await readContract({
        functionName: 'getOrderTimeline',
        args: [BigInt(orderId)],
      }) as Array<any>;

      return items.map((item) => ({
        status: mapStatus(item.status),
        note: item.note,
        at: Number(item.at)
      }));
    } catch (error) {
      console.warn('Falling back to mocked timeline', error);
      return FALLBACK_TIMELINE;
    }
  }, [readContract]);

  const fetchDispute = useCallback(async (orderId: string): Promise<Dispute | undefined> => {
    try {
      const dispute = await readContract({
        functionName: 'getDispute',
        args: [BigInt(orderId)],
      }) as any;

      return {
        stage: mapDisputeStage(dispute.stage),
        claimant: dispute.claimant,
        evidence: dispute.evidence,
        resolution: dispute.resolution
      };
    } catch (error) {
      console.warn('Falling back to mocked dispute', error);
      return FALLBACK_DISPUTE;
    }
  }, [readContract]);

  return {
    fetchOrdersForAccount,
    fetchActiveAds,
    fetchAgentProfile,
    fetchAgentAds,
    fetchOrderTimeline,
    fetchDispute
  };
};

const mapStatus = (status: number): Order['status'] => {
  switch (status) {
    case 0:
      return 'Created';
    case 1:
      return 'Matched';
    case 2:
      return 'InTransit';
    case 3:
      return 'Delivered';
    case 4:
      return 'Disputed';
    case 5:
      return 'Resolved';
    default:
      return 'Created';
  }
};

const mapAvailability = (availability: number): AgentAd['availability'] => {
  switch (availability) {
    case 0:
      return 'Available';
    case 1:
      return 'Queueing';
    case 2:
      return 'Unavailable';
    default:
      return 'Available';
  }
};

const mapDisputeStage = (stage: number): Dispute['stage'] => {
  switch (stage) {
    case 0:
      return 'Filed';
    case 1:
      return 'EvidenceSubmitted';
    case 2:
      return 'MediatorReview';
    case 3:
      return 'Resolved';
    default:
      return 'Filed';
  }
};