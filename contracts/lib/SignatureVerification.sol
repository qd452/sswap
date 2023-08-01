// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {IERC1271} from "../interfaces/IERC1271.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @notice helper for signature verification
library SignatureVerification {
    /// @notice Thrown when the passed in signature is not a valid length
    error InvalidSignatureLength();

    /// @notice Thrown when the recovered signer is equal to the zero address
    error InvalidSignature();

    /// @notice Thrown when the recovered signer does not equal the claimedSigner
    error InvalidSigner();

    /// @notice Thrown when the recovered contract signature is incorrect
    error InvalidContractSignature();

    bytes32 constant UPPER_BIT_MASK = (
        0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
    );

    /// @dev own simple implementation
    function verify(
        bytes memory signature,
        bytes32 hash,
        address claimedSigner
    ) internal pure {
        // signature = bytes.concat(r, s, bytes1(v));
        (bytes32 r, bytes32 s, uint8 v) = SignatureVerification.splitSignature(
            signature
        );
        address signer = ecrecover(hash, v, r, s);
        if (signer == address(0)) revert InvalidSignature();
        if (signer != claimedSigner) revert InvalidSigner();
    }

    function verifyECDSA(
        bytes memory signature,
        bytes32 hash,
        address claimedSigner
    ) internal pure {
        address signer = ECDSA.recover(hash, signature);
        if (signer == address(0)) revert InvalidSignature();
        if (signer != claimedSigner) revert InvalidSigner();
    }

    function splitSignature(
        bytes memory signature
    ) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        if (signature.length != 65) {
            revert InvalidSignatureLength();
        }
        assembly {
            /*
            First 32 bytes stores the length of the signature

            add(sig, 32) = pointer of sig + 32
            effectively, skips first 32 bytes of signature

            mload(p) loads next 32 bytes starting at the memory address p into memory
            */

            // first 32 bytes, after the length prefix
            r := mload(add(signature, 32))
            // second 32 bytes
            s := mload(add(signature, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(signature, 96)))
        }
    }

    /// @dev copy from permit2 contract src/libraries/SignatureVerification.sol
    function verifyERC1271(
        bytes memory signature,
        bytes32 hash,
        address claimedSigner
    ) internal view {
        bytes32 r;
        bytes32 s;
        uint8 v;

        if (claimedSigner.code.length == 0) {
            if (signature.length == 65) {
                (r, s) = abi.decode(signature, (bytes32, bytes32));
                v = uint8(signature[64]);
            } else if (signature.length == 64) {
                // EIP-2098
                bytes32 vs;
                (r, vs) = abi.decode(signature, (bytes32, bytes32));
                s = vs & UPPER_BIT_MASK;
                v = uint8(uint256(vs >> 255)) + 27;
            } else {
                revert InvalidSignatureLength();
            }
            address signer = ecrecover(hash, v, r, s);
            if (signer == address(0)) revert InvalidSignature();
            if (signer != claimedSigner) revert InvalidSigner();
        } else {
            bytes4 magicValue = IERC1271(claimedSigner).isValidSignature(
                hash,
                signature
            );
            if (magicValue != IERC1271.isValidSignature.selector)
                revert InvalidContractSignature();
        }
    }
}
