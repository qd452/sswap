// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {Order, TokenAmount} from "../base/OrderStructs.sol";

/// @notice helpers for handling OrderInfo objects
library OrderLib {
    bytes internal constant ORDER_TYPE =
        "Order(TokenAmount takerTokenAmount,address taker,TokenAmount makerTokenAmount,address maker,uint256 nonce,uint256 deadline,uint256 chainId)"
        "TokenAmount(address token,uint256 amount)";
    bytes32 internal constant ORDER_TYPE_HASH =
        keccak256(abi.encodePacked(ORDER_TYPE));

    bytes internal constant TOKEN_AMOUNT_TYPE =
        "TokenAmount(address token,uint256 amount)";
    bytes32 internal constant TOKEN_AMOUNT_TYPE_HASH =
        keccak256(TOKEN_AMOUNT_TYPE);

    function hashTokenAmount(
        TokenAmount memory tokenAmount
    ) internal pure returns (bytes32) {
        return keccak256(abi.encode(TOKEN_AMOUNT_TYPE_HASH, tokenAmount));
    }

    /// @notice hash an Order object
    /// @param order The Order object to hash
    function hash(Order memory order) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    ORDER_TYPE_HASH,
                    hashTokenAmount(order.takerTokenAmount),
                    order.taker,
                    hashTokenAmount(order.makerTokenAmount),
                    order.maker,
                    order.nonce,
                    order.deadline,
                    order.chainId
                )
            );
    }

    /// @notice hash an Order object
    /// @dev EIP-191 header and domain separator included
    /// @param order The Order object to hash
    /// @param domainSeparator the sswap domain separator
    function hash(
        Order memory order,
        bytes32 domainSeparator
    ) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    "\x19\x01", // EIP191: Indicates EIP712
                    domainSeparator,
                    OrderLib.hash(order)
                )
            );
    }
}
