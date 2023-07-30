// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import {ERC20} from "solmate/src/tokens/ERC20.sol";

/// @dev token with amount for swap
struct TokenAmount {
    ERC20 token;
    uint256 amount;
}

/// @dev order struct
struct Order {
    TokenAmount takerTokenAmount;
    address taker;
    TokenAmount makerTokenAmount;
    address maker;
    // The nonce of the order, allowing for signature replay protection and cancellation
    uint256 nonce;
    // The timestamp after which this order is no longer valid
    uint256 deadline;
    uint256 chainId;
}
