// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";
import {Owned} from "solmate/src/auth/Owned.sol";
// import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {SwapEvents} from "./base/SwapEvents.sol";
import {ISSwap} from "./interfaces/ISSwap.sol";
import {Order} from "./base/OrderStructs.sol";
import {OrderLib} from "./lib/OrderLib.sol";

contract SSwap is SwapEvents, ISSwap, Owned {
    using OrderLib for Order;

    uint256 public immutable CHAIN_ID;

    constructor(address _owner) Owned(_owner) {
        CHAIN_ID = block.chainid;
    }

    function swap(Order calldata order, bytes calldata sig) external payable {}

    function orderHash(Order calldata order) external pure returns (bytes32) {
        return order.hash();
    }
}
