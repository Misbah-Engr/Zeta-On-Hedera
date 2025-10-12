// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Helpers for commit-reveal anti-sniping flows.
library CommitReveal {
    /// @dev Computes the commitment hash for an agent quote.
    /// Encode exactly like the contract expects to avoid grief.
    /// feeTotal: minor units (tinybars or token decimals)
    /// etaHours: uint32, holdbackBps: uint16, microbondBps: uint16
    function commitQuote(
        uint256 orderId,
        uint256 feeTotal,
        uint16 holdbackBps,
        uint16 microbondBps,
        uint32 etaHours,
        bytes32 salt
    ) internal pure returns (bytes32) {
        return keccak256(abi.encode(orderId, feeTotal, holdbackBps, microbondBps, etaHours, salt));
    }
}
