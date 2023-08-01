// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/// @notice standardized events that should be emitted by all swap contract
interface SwapEvents {
    /// @notice emitted when an order is filled
    /// @param orderHash The hash of the order that was filled
    /// @param maker The address which executed the fill
    /// @param nonce The nonce of the filled order
    /// @param taker The taker of the filled order
    event Swap(
        bytes32 indexed orderHash,
        address indexed maker,
        address indexed taker,
        uint256 nonce,
        address makerToken,
        uint256 makerAmount,
        address takerToken,
        uint256 takerAmount
    );
}
