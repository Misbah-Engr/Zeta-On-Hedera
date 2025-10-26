import { useCallback, useEffect, useMemo, useState } from "react";
import { Contract, JsonRpcProvider, JsonRpcSigner } from "ethers";
import {
  CONTRACT_MAP,
  ROLE_IDS,
  ZETA_AGENTS_ABI,
  ZETA_POLICY_ABI
} from "../lib/contracts";
import type { ProtocolAccess, RoleFlags } from "../types";

const POLICY_CONFIG = CONTRACT_MAP["ZetaPolicy"];
const AGENTS_CONFIG = CONTRACT_MAP["ZetaAgents"];

const emptyRoles = (): RoleFlags => ({
  defaultAdmin: false,
  policyAdmin: false,
  operator: false,
  listing: false
});

interface AccessState {
  loading: boolean;
  address?: string;
  isAgent: boolean;
  userBanned: boolean;
  agentBanned: boolean;
  roles: RoleFlags;
}

const defaultState = (): AccessState => ({
  loading: false,
  address: undefined,
  isAgent: false,
  userBanned: false,
  agentBanned: false,
  roles: emptyRoles()
});

export function useProtocolAccess(
  readProvider: JsonRpcProvider,
  signer?: JsonRpcSigner,
  connected?: boolean
): ProtocolAccess {
  const [state, setState] = useState<AccessState>(() => defaultState());

  const refresh = useCallback(async () => {
    if (!connected || !signer) {
      setState(defaultState());
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));

    try {
      const address = await signer.getAddress();

      if (!POLICY_CONFIG?.address) {
        setState({ ...defaultState(), address, loading: false });
        return;
      }

      const policyContract = new Contract(POLICY_CONFIG.address, ZETA_POLICY_ABI, readProvider);

      const [defaultAdmin, policyAdmin, operator, listing, userBanned, agentBanned] = await Promise.all([
        policyContract.hasRole(ROLE_IDS.DEFAULT_ADMIN_ROLE, address).catch(() => false),
        policyContract.hasRole(ROLE_IDS.ROLE_POLICY_ADMIN, address).catch(() => false),
        policyContract.hasRole(ROLE_IDS.ROLE_OPERATOR, address).catch(() => false),
        policyContract.hasRole(ROLE_IDS.ROLE_LISTING, address).catch(() => false),
        policyContract.userBanned(address).catch(() => false),
        policyContract.agentBanned(address).catch(() => false)
      ]);

      let isAgent = false;
      if (AGENTS_CONFIG?.address) {
        const agentsContract = new Contract(AGENTS_CONFIG.address, ZETA_AGENTS_ABI, readProvider);
        isAgent = await agentsContract.isWhitelisted(address).catch(() => false);
      }

      setState({
        loading: false,
        address,
        isAgent,
        userBanned: Boolean(userBanned),
        agentBanned: Boolean(agentBanned),
        roles: {
          defaultAdmin: Boolean(defaultAdmin),
          policyAdmin: Boolean(policyAdmin),
          operator: Boolean(operator),
          listing: Boolean(listing)
        }
      });
    } catch (err) {
      console.error("Failed to refresh protocol access", err);
      setState(defaultState());
    }
  }, [connected, signer, readProvider]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refresh();
      if (cancelled) return;
    })().catch((err) => console.error(err));
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  return useMemo<ProtocolAccess>(
    () => ({
      ...state,
      refresh
    }),
    [state, refresh]
  );
}
