// Utility functions for formatting data, e.g., minor units to major units.

/**
 * Formats a minor unit amount into a major unit string.
 * @param amount The amount in minor units.
 * @param decimals The number of decimal places for the major unit.
 * @returns The formatted string.
 */
export const formatMinorUnits = (amount: number, decimals: number = 2): string => {
  const majorAmount = amount / (10 ** decimals);
  return majorAmount.toFixed(decimals);
};
