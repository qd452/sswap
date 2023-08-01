// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {Order} from "../base/OrderStructs.sol";

interface ISSwap {
    function swap(Order calldata order, bytes calldata sig) external payable;

    function orderHash(Order calldata order) external pure returns (bytes32);
}
