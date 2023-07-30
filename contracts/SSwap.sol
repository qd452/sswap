// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";
import {Owned} from "solmate/src/auth/Owned.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract SSwap is EIP712, Owned {
    uint256 public immutable CHAIN_ID;

    constructor(address _owner) Owned(_owner) {
        CHAIN_ID = block.chainid;
    }
}
