// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {VerifyingPaymaster} from "../VerifyingPaymaster.sol";
import {PackedUserOperation, ENTRY_POINT} from "../interfaces/IEntryPoint.sol";

contract VerifyingPaymasterTest is Test {
    uint256 private constant SPONSOR_KEY = 0x5B0;
    uint256 private constant HALF_N = 0x7FFFFFFF800000007FFFFFFFFFFFFFFFDE737D56D38BCF4279DCE5617E3192A8;

    VerifyingPaymaster private paymaster;
    address private sponsor;

    function setUp() public {
        sponsor = vm.addr(SPONSOR_KEY);
        paymaster = new VerifyingPaymaster(sponsor);
    }

    function _op() private view returns (PackedUserOperation memory op) {
        op.sender = address(0xACC);
        op.nonce = 3;
        op.callData = hex"deadbeef";
        op.accountGasLimits = bytes32(uint256(1));
        op.preVerificationGas = 50_000;
        op.gasFees = bytes32(uint256(2));
        op.paymasterAndData = abi.encodePacked(address(paymaster), uint128(100_000), uint128(0));
    }

    function _withSignature(PackedUserOperation memory op, uint256 key, uint48 validUntil, uint48 validAfter)
        private
        view
        returns (PackedUserOperation memory)
    {
        bytes32 hash = paymaster.getHash(op, validUntil, validAfter);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(key, keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)));
        op.paymasterAndData = abi.encodePacked(op.paymasterAndData, validUntil, validAfter, r, s, v);
        return op;
    }

    function _validate(PackedUserOperation memory op) private returns (uint256 validationData) {
        vm.prank(ENTRY_POINT);
        (, validationData) = paymaster.validatePaymasterUserOp(op, bytes32(0), 0);
    }

    function test_acceptsTheSponsorSignature() public {
        PackedUserOperation memory op = _withSignature(_op(), SPONSOR_KEY, 9_999_999, 1);
        uint256 data = _validate(op);
        assertEq(data & type(uint160).max, 0);
        assertEq(uint48(data >> 160), 9_999_999);
        assertEq(uint48(data >> 208), 1);
    }

    function test_rejectsAnotherSigner() public {
        assertEq(_validate(_withSignature(_op(), 0xBAD, 9_999_999, 1)) & type(uint160).max, 1);
    }

    function test_rejectsATamperedOp() public {
        PackedUserOperation memory op = _withSignature(_op(), SPONSOR_KEY, 9_999_999, 1);
        op.callData = hex"cafebabe";
        assertEq(_validate(op) & type(uint160).max, 1);
    }

    function test_rejectsAChangedValidityWindow() public {
        PackedUserOperation memory op = _op();
        uint256 packedLen = op.paymasterAndData.length;
        op = _withSignature(op, SPONSOR_KEY, 100, 1);
        // same signature, different validUntil
        bytes memory data = op.paymasterAndData;
        data[packedLen + 5] = 0x65;
        op.paymasterAndData = data;
        assertEq(_validate(op) & type(uint160).max, 1);
    }

    function test_rejectsMissingOrMalformedSignature() public {
        assertEq(_validate(_op()) & type(uint160).max, 1);
        PackedUserOperation memory op = _op();
        op.paymasterAndData = abi.encodePacked(op.paymasterAndData, new bytes(40));
        assertEq(_validate(op) & type(uint160).max, 1);
    }

    function test_rejectsMalleableHighS() public {
        PackedUserOperation memory op = _op();
        bytes32 hash = paymaster.getHash(op, 0, 0);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(SPONSOR_KEY, keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)));
        assertLe(uint256(s), HALF_N);
        bytes32 flipped = bytes32(0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141 - uint256(s));
        op.paymasterAndData = abi.encodePacked(op.paymasterAndData, uint48(0), uint48(0), r, flipped, v == 27 ? 28 : 27);
        assertEq(_validate(op) & type(uint160).max, 1);
    }

    function test_onlyTheEntryPointCanValidate() public {
        PackedUserOperation memory op = _withSignature(_op(), SPONSOR_KEY, 0, 0);
        vm.expectRevert(VerifyingPaymaster.NotAuthorized.selector);
        paymaster.validatePaymasterUserOp(op, bytes32(0), 0);
    }

    function test_onlyTheSponsorWithdraws() public {
        vm.expectRevert(VerifyingPaymaster.NotAuthorized.selector);
        paymaster.withdrawTo(payable(address(this)), 1);
    }
}
