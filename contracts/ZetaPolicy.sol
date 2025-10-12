// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {UUPSAuth} from "./base/UUPSAuth.sol";

contract ZetaPolicy is UUPSAuth, PausableUpgradeable {
    // Roles
    bytes32 public constant ROLE_OPERATOR = keccak256("ROLE_OPERATOR");
    bytes32 public constant ROLE_LISTING = keccak256("ROLE_LISTING");

    // Params
    address public treasury;           // where treasury share is paid
    address public allowedToken;       // 0 for HBAR, else HTS-ERC20 address
    uint16  public treasuryBps;        // 0..10000
    uint16  public defaultHoldbackBps; // 0..10000
    uint16  public defaultMicrobondBps;// 0..10000
    uint32  public claimWindowSec;     // PoD dispute window
    uint32  public acceptAckWindowSec; // agent ack TTL

    // Bans
    mapping(address => bool) public userBanned;
    mapping(address => bool) public agentBanned;

    // Contract Suite Addresses
    address public zetaAgents;
    address public zetaOrderBook;
    address public zetaVault;
    address public zetaDisputes;

    event ContractAddressesUpdated(
        address agents,
        address orderBook,
        address vault,
        address disputes
    );
    event ParamsUpdated(
        address treasury,
        address allowedToken,
        uint16 treasuryBps,
        uint16 holdbackBps,
        uint16 microBps,
        uint32 claimWin,
        uint32 ackWin
    );
    event Banned(uint8 kind, address indexed who, bool flag); // kind: 1=user,2=agent
    event Paused();
    event Unpaused();

    function initialize(address admin, address _treasury) external initializer {
        __UUPSAuth_init(admin);
        __Pausable_init();
        treasury = _treasury;
        treasuryBps = 1000;          // 10%
        defaultHoldbackBps = 500;    // 5%
        defaultMicrobondBps = 500;   // 5%
        claimWindowSec = 72 hours;
        acceptAckWindowSec = 2 hours;
        _grantRole(ROLE_OPERATOR, admin);
        _grantRole(ROLE_LISTING, admin);
    }

    // Admin
    function setParams(
        address _treasury,
        address _allowedToken,
        uint16 _treasuryBps,
        uint16 _holdbackBps,
        uint16 _microBps,
        uint32 _claimWin,
        uint32 _ackWin
    ) external onlyRole(ROLE_POLICY_ADMIN) {
        require(_treasuryBps <= 10_000 && _holdbackBps <= 10_000 && _microBps <= 10_000, "BPS");
        treasury = _treasury;
        allowedToken = _allowedToken;
        treasuryBps = _treasuryBps;
        defaultHoldbackBps = _holdbackBps;
        defaultMicrobondBps = _microBps;
        claimWindowSec = _claimWin;
        acceptAckWindowSec = _ackWin;
        emit ParamsUpdated(_treasury, _allowedToken, _treasuryBps, _holdbackBps, _microBps, _claimWin, _ackWin);
    }

    function pause() external onlyRole(ROLE_OPERATOR) { _pause(); emit Paused(); }
    function unpause() external onlyRole(ROLE_OPERATOR) { _unpause(); emit Unpaused(); }

    function setContractAddresses(
        address _zetaAgents,
        address _zetaOrderBook,
        address _zetaVault,
        address _zetaDisputes
    ) external onlyRole(ROLE_POLICY_ADMIN) {
        zetaAgents = _zetaAgents;
        zetaOrderBook = _zetaOrderBook;
        zetaVault = _zetaVault;
        zetaDisputes = _zetaDisputes;
        emit ContractAddressesUpdated(_zetaAgents, _zetaOrderBook, _zetaVault, _zetaDisputes);
    }

    function banUser(address who, bool flag) external onlyRole(ROLE_OPERATOR) {
        userBanned[who] = flag; emit Banned(1, who, flag);
    }
    function banAgent(address who, bool flag) external onlyRole(ROLE_OPERATOR) {
        agentBanned[who] = flag; emit Banned(2, who, flag);
    }
}
