// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IPaymaster, IEntryPoint, PackedUserOperation, ENTRY_POINT} from "./interfaces/IEntryPoint.sol";

// Pays the fee of every UserOp that carries a signature from the sponsor (the owner).
// paymasterAndData = paymaster (20) | verificationGasLimit (16) | postOpGasLimit (16)
//                  | validUntil (6) | validAfter (6) | sponsor signature (65)
contract VerifyingPaymaster is IPaymaster {
    uint256 private constant DATA_OFFSET = 52;
    uint256 private constant SIGNATURE_OFFSET = DATA_OFFSET + 12;
    uint256 private constant SIG_VALIDATION_FAILED = 1;
    uint256 private constant HALF_N = 0x7FFFFFFF800000007FFFFFFFFFFFFFFFDE737D56D38BCF4279DCE5617E3192A8;

    address public immutable owner;

    error NotAuthorized();

    constructor(address sponsor) {
        owner = sponsor;
    }

    // The signed hash leaves out the signature itself (it lives in paymasterAndData after DATA_OFFSET).
    function getHash(PackedUserOperation calldata op, uint48 validUntil, uint48 validAfter)
        public
        view
        returns (bytes32)
    {
        return keccak256(
            abi.encode(
                op.sender,
                op.nonce,
                keccak256(op.initCode),
                keccak256(op.callData),
                op.accountGasLimits,
                op.preVerificationGas,
                op.gasFees,
                keccak256(op.paymasterAndData[:DATA_OFFSET]),
                block.chainid,
                address(this),
                validUntil,
                validAfter
            )
        );
    }

    function validatePaymasterUserOp(PackedUserOperation calldata op, bytes32, uint256)
        external
        view
        returns (bytes memory context, uint256 validationData)
    {
        if (msg.sender != ENTRY_POINT) revert NotAuthorized();
        bytes calldata data = op.paymasterAndData;
        if (data.length != SIGNATURE_OFFSET + 65) return ("", SIG_VALIDATION_FAILED);
        uint48 validUntil = uint48(bytes6(data[DATA_OFFSET:DATA_OFFSET + 6]));
        uint48 validAfter = uint48(bytes6(data[DATA_OFFSET + 6:SIGNATURE_OFFSET]));
        bool valid = _recover(getHash(op, validUntil, validAfter), data[SIGNATURE_OFFSET:]) == owner;
        // validationData: authorizer (0 ok, 1 failed) | validUntil | validAfter
        return ("", (valid ? 0 : SIG_VALIDATION_FAILED) | (uint256(validUntil) << 160) | (uint256(validAfter) << 208));
    }

    function postOp(PostOpMode, bytes calldata, uint256, uint256) external pure {
        revert NotAuthorized(); // never called: the context is always empty
    }

    function withdrawTo(address payable to, uint256 amount) external {
        if (msg.sender != owner) revert NotAuthorized();
        IEntryPoint(ENTRY_POINT).withdrawTo(to, amount);
    }

    function _recover(bytes32 hash, bytes calldata signature) private pure returns (address) {
        bytes32 digest = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
        bytes32 r = bytes32(signature[0:32]);
        bytes32 s = bytes32(signature[32:64]);
        if (uint256(s) > HALF_N) return address(0);
        return ecrecover(digest, uint8(signature[64]), r, s);
    }
}
