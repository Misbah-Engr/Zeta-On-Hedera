import { JsonRpcProvider, JsonRpcSigner } from "ethers";
import type { HashConnectTypes } from "hashconnect";

export interface RoleFlags {
  defaultAdmin: boolean;
  policyAdmin: boolean;
  operator: boolean;
  listing: boolean;
}

export interface ProtocolAccess {
  loading: boolean;
  address?: string;
  isAgent: boolean;
  userBanned: boolean;
  agentBanned: boolean;
  roles: RoleFlags;
  refresh(): Promise<void>;
}

export interface AppViewContext {
  readProvider: JsonRpcProvider;
  signer?: JsonRpcSigner;
  connected: boolean;
  connect(): void;
  disconnect(): void;
  accountId?: string;
  access: ProtocolAccess;
  pairingData?: HashConnectTypes.SavedPairingData;
}
