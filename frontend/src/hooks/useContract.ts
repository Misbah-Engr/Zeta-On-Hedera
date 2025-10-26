import { useMemo } from "react";
import { Contract, JsonRpcProvider, JsonRpcSigner } from "ethers";
import { CONTRACT_MAP, ContractConfig } from "../lib/contracts";

interface UseContractResult {
  config?: ContractConfig;
  read?: Contract;
  write?: Contract;
}

export function useContract(
  name: string,
  readProvider: JsonRpcProvider,
  signer?: JsonRpcSigner
): UseContractResult {
  return useMemo(() => {
    const config = CONTRACT_MAP[name];
    if (!config?.address) {
      return { config };
    }

    const read = new Contract(config.address, config.abi, readProvider);
    const write = signer ? new Contract(config.address, config.abi, signer) : undefined;

    return { config, read, write };
  }, [name, readProvider, signer]);
}
