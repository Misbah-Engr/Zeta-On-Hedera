// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {UUPSAuth} from "./base/UUPSAuth.sol";
import {CommitReveal} from "./lib/CommitReveal.sol";

interface IZetaPolicy {
    function userBanned(address who) external view returns (bool);
    function agentBanned(address who) external view returns (bool);
    function acceptAckWindowSec() external view returns (uint32);
    function defaultHoldbackBps() external view returns (uint16);
    function defaultMicrobondBps() external view returns (uint16);
}
interface IZetaAgents {
    function isWhitelisted(address agent) external view returns (bool);
    function riskScore(address agent) external view returns (uint16);
}
interface IZetaVault {
    function onAccepted(uint256 orderId, uint256 feeTotal, uint16 holdbackBps, uint16 microBps, address agent, address user) external;
    function userFund(uint256 orderId, uint256 amount) external payable;
    function markCompleted(uint256 orderId) external;
}

contract ZetaOrderBook is UUPSAuth, PausableUpgradeable, ReentrancyGuardUpgradeable {
    IZetaPolicy public policy;
    IZetaAgents public agents;
    IZetaVault  public vault;

    enum OrderStatus { Created, Selected, Accepted, Completed, Canceled, Disputed, Resolved }

    struct OrderIntent {
        address user;
        address token;        // 0 for HBAR, else HTS-ERC20 address
        uint256 maxTotal;     // user ceiling (minor units)
        bytes32 originShopId; // opaque
        bytes32 destRegion;   // opaque
        bytes32 commodityId;  // opaque
        uint256 qty;
        uint64  createdAt;
        uint64  expiry;
        OrderStatus status;
    }

    struct QuoteCommit { bytes32 commit; uint64 ttl; }
    struct Quote { uint256 feeTotal; uint16 holdbackBps; uint16 microbondBps; uint32 etaHours; }

    uint256 public nextOrderId;
    mapping(uint256 => OrderIntent) public orders;
    mapping(uint256 => mapping(address => QuoteCommit)) public commits;
    mapping(uint256 => mapping(address => Quote)) public revealed;
    mapping(uint256 => address[]) public candidateAgents;
    mapping(uint256 => address) public selectedAgent;
    mapping(uint256 => uint64)  public selectedAt;

    // weights (scaled) for scoring; exposed so governor can tweak if needed
    uint32 public weightPrice;  // default 1_000_000
    uint32 public weightEta;    // default 10_000
    uint32 public weightRisk;   // default 1

    event OrderCreated(uint256 indexed orderId, address indexed user, address token, uint256 maxTotal, bytes32 originShopId, bytes32 destRegion, bytes32 commodityId, uint256 qty);
    event QuoteCommitted(uint256 indexed orderId, address indexed agent, uint64 ttl);
    event QuoteRevealed(uint256 indexed orderId, address indexed agent, uint256 feeTotal, uint32 etaHours, uint16 holdbackBps, uint16 microbondBps);
    event OrderSelected(uint256 indexed orderId, address indexed agent);
    event OrderAccepted(uint256 indexed orderId, address indexed agent);
    event OrderCanceled(uint256 indexed orderId);

    function initialize(address admin, address policyAddr, address agentsAddr, address vaultAddr) external initializer {
        __UUPSAuth_init(admin);
        __Pausable_init();
        __ReentrancyGuard_init();
        policy = IZetaPolicy(policyAddr);
        agents = IZetaAgents(agentsAddr);
        vault  = IZetaVault(vaultAddr);
        weightPrice = 1_000_000;
        weightEta   = 10_000;
        weightRisk  = 1;
    }

    modifier onlyOrderUser(uint256 orderId) {
        require(orders[orderId].user == msg.sender, "NOT_USER");
        _;
    }

    function createOrderIntent(
        address token,
        uint256 maxTotal,
        bytes32 originShopId,
        bytes32 destRegion,
        bytes32 commodityId,
        uint256 qty,
        uint64  expiry
    ) external whenNotPaused returns (uint256 orderId) {
        require(!policy.userBanned(msg.sender), "USER_BANNED");
        orderId = ++nextOrderId;
        orders[orderId] = OrderIntent({
            user: msg.sender,
            token: token,
            maxTotal: maxTotal,
            originShopId: originShopId,
            destRegion: destRegion,
            commodityId: commodityId,
            qty: qty,
            createdAt: uint64(block.timestamp),
            expiry: expiry,
            status: OrderStatus.Created
        });
        emit OrderCreated(orderId, msg.sender, token, maxTotal, originShopId, destRegion, commodityId, qty);
    }

    function commitQuote(uint256 orderId, bytes32 commit, uint64 ttl) external whenNotPaused {
        require(orders[orderId].status == OrderStatus.Created, "BAD_STATE");
        require(block.timestamp < orders[orderId].expiry, "EXPIRED");
        require(agents.isWhitelisted(msg.sender), "NOT_AGENT");
        require(!policy.agentBanned(msg.sender), "AGENT_BANNED");
        QuoteCommit storage slot = commits[orderId][msg.sender];
        require(slot.commit == bytes32(0), "DUP");
        slot.commit = commit;
        slot.ttl = ttl;
        emit QuoteCommitted(orderId, msg.sender, ttl);
    }

    function revealQuote(
        uint256 orderId,
        uint256 feeTotal,
        uint16 holdbackBps,
        uint16 microbondBps,
        uint32 etaHours,
        bytes32 salt
    ) external whenNotPaused {
        require(orders[orderId].status == OrderStatus.Created, "BAD_STATE");
        QuoteCommit memory c = commits[orderId][msg.sender];
        require(c.commit != bytes32(0) && block.timestamp <= c.ttl, "NO_COMMIT");
        bytes32 expect = CommitReveal.commitQuote(orderId, feeTotal, holdbackBps, microbondBps, etaHours, salt);
        require(expect == c.commit, "COMMIT_MISMATCH");

        // enforce minimums from policy
        uint16 minHold = policy.defaultHoldbackBps();
        uint16 minMicro = policy.defaultMicrobondBps();
        if (holdbackBps < minHold) holdbackBps = minHold;
        if (microbondBps < minMicro) microbondBps = minMicro;

        revealed[orderId][msg.sender] = Quote({
            feeTotal: feeTotal,
            holdbackBps: holdbackBps,
            microbondBps: microbondBps,
            etaHours: etaHours
        });
        candidateAgents[orderId].push(msg.sender);
        emit QuoteRevealed(orderId, msg.sender, feeTotal, etaHours, holdbackBps, microbondBps);
    }

    function _score(uint256 orderId, address agent) internal view returns (uint256) {
        Quote memory q = revealed[orderId][agent];
        uint32 risk = agents.riskScore(agent);
        return uint256(weightPrice) * q.feeTotal
             + uint256(weightEta)   * q.etaHours
             + uint256(weightRisk)  * risk;
    }

    function autoSelect(uint256 orderId) external whenNotPaused {
        OrderIntent storage o = orders[orderId];
        require(o.status == OrderStatus.Created, "BAD_STATE");
        require(block.timestamp <= o.expiry, "EXPIRED");
        address[] memory list = candidateAgents[orderId];
        require(list.length > 0, "NO_QUOTES");

        address best; uint256 bestScore = type(uint256).max;
        for (uint256 i; i < list.length; ++i) {
            address a = list[i];
            Quote memory q = revealed[orderId][a];
            if (q.feeTotal == 0 || q.feeTotal > o.maxTotal) continue;
            uint256 s = _score(orderId, a);
            if (s < bestScore) { bestScore = s; best = a; }
        }
        require(best != address(0), "NO_MATCH");
        selectedAgent[orderId] = best;
        selectedAt[orderId] = uint64(block.timestamp);
        o.status = OrderStatus.Selected;
        emit OrderSelected(orderId, best);
    }

    /// @notice Agent acknowledges selection; Vault locks microbond math.
    function ackSelect(uint256 orderId) external whenNotPaused {
        OrderIntent storage o = orders[orderId];
        require(o.status == OrderStatus.Selected, "BAD_STATE");
        require(msg.sender == selectedAgent[orderId], "NOT_SELECTED_AGENT");
        require(block.timestamp <= selectedAt[orderId] + policy.acceptAckWindowSec(), "ACK_EXPIRED");

        Quote memory q = revealed[orderId][msg.sender];
        vault.onAccepted(orderId, q.feeTotal, q.holdbackBps, q.microbondBps, msg.sender, o.user);
        o.status = OrderStatus.Accepted;
        emit OrderAccepted(orderId, msg.sender);
    }

    /// @notice Optional: user funds after accept. If you prefer fund-before-select, call vault.userFund earlier.
    function userFund(uint256 orderId, uint256 amount) external payable whenNotPaused onlyOrderUser(orderId) nonReentrant {
        require(orders[orderId].status == OrderStatus.Accepted, "BAD_STATE");
        vault.userFund{value: msg.value}(orderId, amount);
        // Vault will emit UserFunded; no local event
    }

    /// @notice Called when agent submits PoD off-chain and you decide to mark completed (or wire a Disputes hook).
    function markCompleted(uint256 orderId) external whenNotPaused {
        require(orders[orderId].status == OrderStatus.Accepted, "BAD_STATE");
        orders[orderId].status = OrderStatus.Completed;
        vault.markCompleted(orderId);
        // Payment split happens inside Vault
    }

    function cancel(uint256 orderId) external whenNotPaused {
        OrderIntent storage o = orders[orderId];
        require(o.status == OrderStatus.Created, "BAD_STATE");
        require(msg.sender == o.user, "NOT_USER");
        o.status = OrderStatus.Canceled;
        emit OrderCanceled(orderId);
        // If you had pre-funded escrow, invoke Vault.refundUser(orderId) here (not included in minimal ABI).
    }
}
