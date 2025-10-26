export type OrderStatus =
  | 'Created'
  | 'Matched'
  | 'InTransit'
  | 'Delivered'
  | 'Disputed'
  | 'Resolved';

export interface Order {
  id: string;
  buyer: string;
  agent: string;
  commodity: string;
  origin: string;
  destination: string;
  status: OrderStatus;
  price: string;
  updatedAt: number;
}

export interface OrderLifecycleEvent {
  status: OrderStatus | 'Created';
  note: string;
  at: number;
}

export type DisputeStage = 'Filed' | 'EvidenceSubmitted' | 'MediatorReview' | 'Resolved';

export interface Dispute {
  stage: DisputeStage;
  claimant: string;
  evidence: string;
  resolution: string;
}

export interface Agent {
  id: string;
  handle: string;
  avatar: string;
  baseLocation: string;
  rating: number;
  completedDeliveries: number;
  disputedDeliveries: number;
}

export interface AgentProfile extends Agent {
  bio: string;
}

export type AgentAvailability = 'Available' | 'Queueing' | 'Unavailable';

export interface AgentAd {
  id: string;
  agentId: string;
  commodity: string;
  location: string;
  price: string;
  minWeight: number;
  maxWeight: number;
  availability: AgentAvailability;
}

export interface AgentRegistrationPayload {
  legalName: string;
  operatingRegions: string[];
  certifications: string[];
  baseLocation: string;
  complianceContact: string;
  coldChainCapable: boolean;
  insuranceProvider: string;
  fleetDescription: string;
  proofUrl: string;
}
