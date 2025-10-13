import { blake2bHex } from 'blakejs';

/**
 * Hashes Proof of Delivery (PoD) and claim data using the specified algorithm.
 * Algorithm: blake2b_256( utf8(value) || ":" || orderId || ":" || VITE_RP_ID ) → hex
 * @param value The value to hash (e.g., OTP code, CID).
 * @param orderId The ID of the order.
 * @param appPepper The application pepper (from VITE_RP_ID).
 * @returns The hex-encoded hash.
 */
export const hashData = (value: string, orderId: string, appPepper: string): string => {
  const input = `${value}:${orderId}:${appPepper}`;
  return blake2bHex(input, undefined, 32); // 32 bytes = 256 bits
};
