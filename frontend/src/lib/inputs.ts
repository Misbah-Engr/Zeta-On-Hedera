import { ethers } from "ethers";

export function parseInputValue(type: string, raw: string): any {
  if (type.endsWith("[]")) {
    const base = type.slice(0, -2);
    if (!raw.trim()) return [];
    return raw
      .split(",")
      .map((chunk) => parseInputValue(base, chunk.trim()))
      .filter((item) => item !== undefined && item !== "");
  }

  if (type.startsWith("uint") || type.startsWith("int")) {
    if (!raw) return 0n;
    return BigInt(raw);
  }

  if (type === "bool") {
    if (!raw) return false;
    return raw === "true" || raw === "1";
  }

  if (type.startsWith("bytes32")) {
    if (raw.startsWith("0x")) return raw;
    return ethers.encodeBytes32String(raw);
  }

  if (type.startsWith("bytes")) {
    if (raw.startsWith("0x")) return raw;
    return ethers.hexlify(ethers.toUtf8Bytes(raw));
  }

  if (type === "address") {
    return raw;
  }

  if (type === "string") {
    return raw;
  }

  return raw;
}
