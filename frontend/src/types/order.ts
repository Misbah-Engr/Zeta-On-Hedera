export interface Order {
  id: string;
  status: string;
  maxTotal: number;
  selectedAgent: string;
  updatedAt: string;
  user: string;
  agent: string;
  token: string;
  qty: number;
  selectedFee: number;
  holdbackBps: number;
  microbondBps: number;
  treasuryBps: number;
  pod: any;
}