import { AbiFunction } from "ethers";
import { ContractConfig } from "./contracts";

export function getAbiFunction(config: ContractConfig | undefined, name: string, index = 0): AbiFunction | undefined {
  if (!config) return undefined;
  const matches = (config.abi as any[]).filter((item) => item.type === "function" && item.name === name) as AbiFunction[];
  return matches[index];
}

export function humanize(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^./, (ch) => ch.toUpperCase());
}
