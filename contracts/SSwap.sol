// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";
import {Owned} from "solmate/src/auth/Owned.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {SwapEvents} from "./base/SwapEvents.sol";
import {ISSwap} from "./interfaces/ISSwap.sol";
import {Order} from "./base/OrderStructs.sol";
import {OrderLib} from "./lib/OrderLib.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {SignatureVerification} from "./lib/SignatureVerification.sol";
import {ERC20} from "solmate/src/tokens/ERC20.sol";
import {SafeTransferLib} from "solmate/src/utils/SafeTransferLib.sol";

contract SSwap is SwapEvents, ISSwap, ReentrancyGuard, EIP712, Owned {
    using OrderLib for Order;
    using SignatureVerification for bytes;

    string public constant DOMAIN_NAME = "SSWAP";
    string public constant DOMAIN_VERSION = "0.1.0";
    bytes32 public immutable DOMAIN_SEPARATOR;

    uint256 public immutable CHAIN_ID;

    mapping(address => uint256) internal nonceUsed;

    error NonceUsed();
    error OrderExpired();
    error InvalidSender();

    constructor(
        address _owner
    ) Owned(_owner) EIP712(DOMAIN_NAME, DOMAIN_VERSION) {
        CHAIN_ID = block.chainid;
        DOMAIN_SEPARATOR = _domainSeparatorV4();
    }

    function swap(
        Order calldata order,
        bytes calldata sig
    ) external payable nonReentrant {
        bytes32 _orderHash = _check(order, sig);
        SafeTransferLib.safeTransferFrom(
            order.takerTokenAmount.token,
            order.taker,
            order.maker,
            order.takerTokenAmount.amount
        );
        SafeTransferLib.safeTransferFrom(
            order.makerTokenAmount.token,
            order.maker,
            order.taker,
            order.makerTokenAmount.amount
        );
        emit Swap(
            _orderHash,
            order.maker,
            order.taker,
            order.nonce,
            address(order.makerTokenAmount.token),
            order.makerTokenAmount.amount,
            address(order.takerTokenAmount.token),
            order.takerTokenAmount.amount
        );
    }

    function orderHash(Order calldata order) external pure returns (bytes32) {
        return order.hash();
    }

    function orderHashWithDomain(
        Order calldata order
    ) external view returns (bytes32) {
        return order.hash(DOMAIN_SEPARATOR);
    }

    function domainSeparator() external view returns (bytes32) {
        return DOMAIN_SEPARATOR;
    }

    function _check(
        Order memory order,
        bytes memory sig
    ) internal view returns (bytes32) {
        bytes32 orderTypedDataHash = order.hash(DOMAIN_SEPARATOR);
        sig.verify(orderTypedDataHash, order.maker);

        if (order.taker != msg.sender) {
            revert InvalidSender();
        }

        if (order.nonce <= nonceUsed[order.maker]) {
            revert NonceUsed();
        }

        if (block.timestamp > order.deadline) {
            revert OrderExpired();
        }

        return orderTypedDataHash;
    }
}
