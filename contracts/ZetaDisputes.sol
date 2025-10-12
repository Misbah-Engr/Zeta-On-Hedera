// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {UUPSAuth} from "./base/UUPSAuth.sol";

interface IZetaPolicyD {
    function zetaVault() external view returns (address);
}

interface IZetaVaultD {
    function releaseHoldback(uint256 orderId) external;
    function slashForFault(uint256 orderId, uint256 toUser, uint256 toTreasury) external;
    function orderLocks(uint256 orderId) external view returns (uint256 userLock, address user, uint256 holdback, uint256 agentDue, uint256 microbond, uint256 treasuryAmount, address agent, uint64 lockedAt, bool paidMain, bool holdReleased);
}

contract ZetaDisputes is UUPSAuth {
    IZetaPolicyD public policy;
    IZetaVaultD public vault;

    // 0 none, 1 open, 2 resolved
    mapping(uint256 => uint8) public disputeState;

    struct PodRef { bytes32 hash; uint8 kind; }
    mapping(uint256 => PodRef[]) public orderPods;
    mapping(uint256 => PodRef[]) public userClaims;

    event PoDSubmitted(uint256 indexed orderId, uint256 kindsBitmap, bytes32 rootHash);
    event ClaimOpened(uint256 indexed orderId);
    event DisputeResolved(uint256 indexed orderId, uint8 outcomeCode); // 0=deny,1=approve

    function initialize(address admin, address policyAddr) external initializer {
        __UUPSAuth_init(admin);
        policy = IZetaPolicyD(policyAddr);
    }

    function setVaultContract(address vaultAddr) external onlyRole(ROLE_POLICY_ADMIN) {
        vault = IZetaVaultD(vaultAddr);
    }

    // Minimal stub events + state for indexer wiring. Real logic would verify PoD vs claim and call Vault to release or slash.

    function submitPoD(uint256 orderId, bytes32[] calldata hashes, uint8[] calldata kinds) external {
        require(hashes.length == kinds.length && hashes.length > 0, "BAD_POD");
        uint256 bm;
        for (uint i = 0; i < kinds.length; ++i) {
            orderPods[orderId].push(PodRef(hashes[i], kinds[i]));
            bm |= (1 << kinds[i]);
        }
        bytes32 agg = keccak256(abi.encode(hashes, kinds));
        emit PoDSubmitted(orderId, bm, agg);
    }

    function openClaim(uint256 orderId, bytes32[] calldata hashes, uint8[] calldata kinds) external {
        require(disputeState[orderId] == 0, "ALREADY");
        require(hashes.length == kinds.length && hashes.length > 0, "BAD_CLAIM");
        for (uint i = 0; i < hashes.length; i++) {
            userClaims[orderId].push(PodRef(hashes[i], kinds[i]));
        }
        disputeState[orderId] = 1;
        emit ClaimOpened(orderId);
    }

    function autoResolve(uint256 orderId) external {
        require(disputeState[orderId] == 1, "NO_CLAIM");
        disputeState[orderId] = 2;

        bool agentProvidedPoD = orderPods[orderId].length > 0;

        if (agentProvidedPoD) {
            // Agent provided proof, deny the user's claim and release holdback to agent.
            vault.releaseHoldback(orderId);
            emit DisputeResolved(orderId, 0); // 0 = Deny
        } else {
            // Agent did NOT provide proof, approve user's claim and slash the agent.
            (uint256 userLock, , , , , , , , , ) = vault.orderLocks(orderId);
            vault.slashForFault(orderId, userLock, 0);
            emit DisputeResolved(orderId, 1); // 1 = Approve
        }
    }
}
