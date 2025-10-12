// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {UUPSAuth} from "./base/UUPSAuth.sol";

interface IZetaVault {
    function increaseStandingBond(address agent, uint256 amount) external payable;
    function decreaseStandingBond(address agent, uint256 amount) external;
    function standingBond(address agent) external view returns (uint256);
}

contract ZetaAgents is UUPSAuth, ReentrancyGuardUpgradeable {
    bytes32 public constant ROLE_LISTING = keccak256("ROLE_LISTING");

    struct Agent {
        bool    whitelisted;
        uint16  riskScoreBps;   // 0 best .. 10000 worst
        bytes32 feeScheduleCid; // optional IPFS anchor
    }

    mapping(address => Agent) public agents;
    IZetaVault public vault;

    event AgentListed(address indexed agent);
    event AgentUnlisted(address indexed agent);
    event AgentRiskUpdated(address indexed agent, uint16 score);
    event AgentFeeAnchor(address indexed agent, bytes32 cid);
    event AgentBondChanged(address indexed agent, int256 delta, uint256 newBond);

    function initialize(address admin, address vaultAddr) external initializer {
        __UUPSAuth_init(admin);
        __ReentrancyGuard_init();
        vault = IZetaVault(vaultAddr);
    }

    modifier onlyListed(address agent) {
        require(agents[agent].whitelisted, "NOT_LISTED");
        _;
    }

    // Listing
    function whitelist(address agent) external onlyRole(ROLE_LISTING) {
        agents[agent].whitelisted = true;
        emit AgentListed(agent);
    }
    function unlist(address agent) external onlyRole(ROLE_LISTING) {
        agents[agent].whitelisted = false;
        emit AgentUnlisted(agent);
    }
    function setRisk(address agent, uint16 bps) external onlyRole(ROLE_LISTING) {
        require(bps <= 10_000, "BPS");
        agents[agent].riskScoreBps = bps;
        emit AgentRiskUpdated(agent, bps);
    }

    // Agent self-service
    function setFeeAnchor(bytes32 cid) external onlyListed(msg.sender) {
        agents[msg.sender].feeScheduleCid = cid;
        emit AgentFeeAnchor(msg.sender, cid);
    }

    // Standing bond management (escrowed in Vault)
    function bondDeposit(uint256 amount) external payable onlyListed(msg.sender) nonReentrant {
        vault.increaseStandingBond{value: msg.value}(msg.sender, amount);
        emit AgentBondChanged(msg.sender, int256(amount), vault.standingBond(msg.sender));
    }
    function bondWithdraw(uint256 amount) external onlyListed(msg.sender) nonReentrant {
        vault.decreaseStandingBond(msg.sender, amount);
        emit AgentBondChanged(msg.sender, -int256(amount), vault.standingBond(msg.sender));
    }

    // Views
    function riskScore(address agent) external view returns (uint16) { return agents[agent].riskScoreBps; }
    function isWhitelisted(address agent) external view returns (bool) { return agents[agent].whitelisted; }
}
