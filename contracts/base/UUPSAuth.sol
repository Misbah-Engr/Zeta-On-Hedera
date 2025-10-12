// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

abstract contract UUPSAuth is UUPSUpgradeable, AccessControlUpgradeable {
    bytes32 internal constant ROLE_POLICY_ADMIN = keccak256("ROLE_POLICY_ADMIN");

    function __UUPSAuth_init(address admin) internal onlyInitializing {
        __UUPSUpgradeable_init();
        __AccessControl_init_unchained();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ROLE_POLICY_ADMIN, admin);
    }

    function _authorizeUpgrade(address) internal view override onlyRole(ROLE_POLICY_ADMIN) {}
}
