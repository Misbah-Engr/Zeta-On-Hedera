// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {UUPSAuth} from "./base/UUPSAuth.sol";

interface IZetaPolicyV2 {
    function treasury() external view returns (address);
    function treasuryBps() external view returns (uint16);
    function claimWindowSec() external view returns (uint32);
    function allowedToken() external view returns (address);
    function zetaAgents() external view returns (address);
    function zetaOrderBook() external view returns (address);
    function zetaDisputes() external view returns (address);
}
interface IZetaAgentsV {
    function isWhitelisted(address agent) external view returns (bool);
}
contract ZetaVault is UUPSAuth, ReentrancyGuardUpgradeable {
    using SafeERC20 for IERC20;

    IZetaPolicyV2 public policy;
    IZetaAgentsV public agents;

    struct Locks {
        uint256 userLock;   // user's paid amount
        address user;       // user's address for refunds
        uint256 holdback;   // portion pending window
        uint256 agentDue;   // immediate at completion (ex holdback & treasury)
        uint256 microbond;  // from agent standing bond (held internally)
        uint256 treasuryAmount; // cached treasury amount
        address agent;
        uint64  lockedAt;   // for claim window
        bool    paidMain;   // has Paid() (treasury+agentDue) executed
        bool    holdReleased;
    }
    mapping(uint256 => Locks) public orderLocks;
    mapping(address => uint256) public standingBond; // agent => bond balance (escrowed here)

    event UserFunded(uint256 indexed orderId, uint256 amount);
    event Locked(uint256 indexed orderId, uint256 treasury, uint256 agentDue, uint256 holdback, uint256 microbond);
    event Paid(uint256 indexed orderId, uint256 toTreasury, uint256 toAgent);
    event HoldReleased(uint256 indexed orderId, uint256 toAgent);
    event Slashed(uint256 indexed orderId, uint256 toUser, uint256 toTreasury, uint256 fromStandingBond);
    event AgentBondChanged(address indexed agent, int256 delta, uint256 newBond);

    function initialize(address admin, address policyAddr, address agentsAddr) external initializer {
        __UUPSAuth_init(admin);
        __ReentrancyGuard_init();
        policy = IZetaPolicyV2(policyAddr);
        agents = IZetaAgentsV(agentsAddr);
    }

    function setAgentsContract(address agentsAddr) external onlyRole(ROLE_POLICY_ADMIN) {
        agents = IZetaAgentsV(agentsAddr);
    }

    modifier onlyZetaAgents() {
        require(msg.sender == policy.zetaAgents(), "ONLY_AGENTS");
        _;
    }

    modifier onlyZetaOrderBook() {
        require(msg.sender == policy.zetaOrderBook(), "ONLY_ORDERBOOK");
        _;
    }

    // ---- Standing bond escrow (called via Agents contract) ----
    function increaseStandingBond(address agent, uint256 amount) external payable onlyZetaAgents {
        address token = policy.allowedToken();
        if (token == address(0)) {
            require(msg.value == amount, "HBAR_PULL");
        } else {
            IERC20(token).safeTransferFrom(agent, address(this), amount);
        }
        standingBond[agent] += amount;
        emit AgentBondChanged(agent, int256(amount), standingBond[agent]);
    }
    function decreaseStandingBond(address agent, uint256 amount) external onlyZetaAgents {
        require(standingBond[agent] >= amount, "BOND_LOW");
        standingBond[agent] -= amount;
        _push(agent, amount);
        emit AgentBondChanged(agent, -int256(amount), standingBond[agent]);
    }

    // ---- Order lifecycle locks ----

    /// @dev Called by OrderBook. Locks per-order decomposition and microbond.
    function onAccepted(
        uint256 orderId,
        uint256 feeTotal,
        uint16 holdbackBps,
        uint16 microBps,
        address agent,
        address user
    ) external onlyZetaOrderBook {
        require(agents.isWhitelisted(agent), "NOT_AGENT");
        Locks storage L = orderLocks[orderId];
        require(L.agent == address(0), "ALREADY");
        // treasury
        uint256 treas = (feeTotal * policy.treasuryBps()) / 10_000;
        uint256 hold = (feeTotal * holdbackBps) / 10_000;
        uint256 micro = (feeTotal * microBps) / 10_000;
        uint256 due = feeTotal - treas - hold;
        require(standingBond[agent] >= micro, "BOND_LOW");

        // reserve microbond
        standingBond[agent] -= micro;

        L.agent = agent;
        L.user = user;
        L.holdback = hold;
        L.agentDue = due;
        L.microbond = micro;
        L.treasuryAmount = treas;
        L.lockedAt = uint64(block.timestamp);

        emit Locked(orderId, treas, due, hold, micro);
    }

    /// @dev User pays into escrow. If allowedToken==0 treat as HBAR transfer.
    function userFund(uint256 orderId, uint256 amount) external payable nonReentrant {
        Locks storage L = orderLocks[orderId];
        require(L.agent != address(0), "NOT_ACCEPTED");

        address token = policy.allowedToken();
        if (token == address(0)) {
            require(msg.value == amount, "HBAR_MISMATCH");
        } else {
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        }
        L.userLock += amount;
        emit UserFunded(orderId, amount);
    }

    /// @dev Pay treasury+agentDue once Completed.
    function markCompleted(uint256 orderId) external onlyZetaOrderBook nonReentrant {
        Locks storage L = orderLocks[orderId];
        require(!L.paidMain && L.agent != address(0), "BAD_STATE");
        uint256 treas = L.treasuryAmount;
        uint256 due = L.agentDue;
        require(L.userLock >= treas + due + L.holdback, "FUNDS_LOW");

        _pay(policy.treasury(), treas);
        _pay(L.agent, due);
        L.paidMain = true;

        emit Paid(orderId, treas, due);
    }

    /// @dev After claim window and if no slash, release holdback and return microbond to agent.
    function releaseHoldback(uint256 orderId) external nonReentrant {
        Locks storage L = orderLocks[orderId];
        require(L.paidMain && !L.holdReleased, "BAD_STATE");
        require(block.timestamp >= L.lockedAt + policy.claimWindowSec(), "WINDOW");
        _pay(L.agent, L.holdback);
        standingBond[L.agent] += L.microbond; // return microbond
        L.holdReleased = true;
        emit HoldReleased(orderId, L.holdback);
    }

    modifier onlyZetaDisputes() {
        require(msg.sender == policy.zetaDisputes(), "ONLY_DISPUTES");
        _;
    }

    function slashForFault(
        uint256 orderId,
        uint256 toUserAmount,
        uint256 toTreasuryAmount
    ) external nonReentrant onlyZetaDisputes {
        Locks storage L = orderLocks[orderId];
        require(L.paidMain && !L.holdReleased, "BAD_STATE");

        uint256 totalSlash = toUserAmount + toTreasuryAmount;
        uint256 fromStandingBond;

        // Pay from holdback first
        uint256 fromHoldback = L.holdback > totalSlash ? totalSlash : L.holdback;
        if (fromHoldback > 0) {
            L.holdback -= fromHoldback;
        }

        // Then from microbond
        uint256 remainingSlash = totalSlash - fromHoldback;
        uint256 fromMicrobond;
        if (remainingSlash > 0) {
            fromMicrobond = L.microbond > remainingSlash ? remainingSlash : L.microbond;
            L.microbond -= fromMicrobond;
            remainingSlash -= fromMicrobond;
        }

        // Then from main standing bond
        if (remainingSlash > 0) {
            fromStandingBond = standingBond[L.agent] > remainingSlash ? remainingSlash : standingBond[L.agent];
            require(fromStandingBond == remainingSlash, "INSUFFICIENT_BOND");
            standingBond[L.agent] -= fromStandingBond;
        }

        // Perform payouts
        if (toUserAmount > 0) _pay(L.user, toUserAmount);
        if (toTreasuryAmount > 0) _pay(policy.treasury(), toTreasuryAmount);

        // Return any remaining holdback to agent and microbond to standing bond
        if (L.holdback > 0) _pay(L.agent, L.holdback);
        if (L.microbond > 0) standingBond[L.agent] += L.microbond;

        L.holdReleased = true;
        emit Slashed(orderId, toUserAmount, toTreasuryAmount, fromStandingBond);
    }

    // ---- internal helpers ----
    function _push(address to, uint256 amount) internal {
        address token = policy.allowedToken();
        if (token == address(0)) {
            (bool ok, ) = to.call{value: amount}("");
            require(ok, "HBAR_PUSH");
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }
    function _pay(address to, uint256 amount) internal { _push(to, amount); }

    receive() external payable {}
}
