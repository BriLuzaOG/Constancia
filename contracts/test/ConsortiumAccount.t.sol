// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {ConsortiumAccount} from "../ConsortiumAccount.sol";
import {AccountFactory} from "../AccountFactory.sol";
import {PackedUserOperation, ENTRY_POINT} from "../interfaces/IEntryPoint.sol";

contract Target {
    uint256 public value;

    function set(uint256 v) external {
        value = v;
    }
}

contract ConsortiumAccountTest is Test {
    uint256 private constant KEY_A = 0xA11CE;
    uint256 private constant KEY_B = 0xB0B;
    uint256 private constant P256_N = 0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551;

    AccountFactory private factory;
    ConsortiumAccount private account;
    bytes32 private keyIdA;
    Target private target;

    function setUp() public {
        vm.warp(1_000_000);
        factory = new AccountFactory();
        (bytes32 x, bytes32 y) = _pub(KEY_A);
        keyIdA = keccak256(abi.encodePacked(x, y));
        account = ConsortiumAccount(factory.createAccount(x, y, 0));
        target = new Target();
    }

    function _pub(uint256 key) private pure returns (bytes32, bytes32) {
        (uint256 x, uint256 y) = vm.publicKeyP256(key);
        return (bytes32(x), bytes32(y));
    }

    function _op(bytes memory signature) private view returns (PackedUserOperation memory op) {
        op.sender = address(account);
        op.signature = signature;
    }

    function _sign(uint256 key, bytes32 keyId, bytes32 userOpHash) private pure returns (bytes memory) {
        (bytes32 r, bytes32 s) = vm.signP256(key, sha256(abi.encodePacked(userOpHash)));
        return abi.encodePacked(keyId, r, s);
    }

    function _validate(bytes memory signature, bytes32 userOpHash) private returns (uint256) {
        vm.prank(ENTRY_POINT);
        return account.validateUserOp(_op(signature), userOpHash, 0);
    }

    function _selfCall(bytes memory data) private {
        vm.prank(ENTRY_POINT);
        account.execute(address(account), 0, data);
    }

    function test_factoryPredictsAddressAndIsIdempotent() public {
        (bytes32 x, bytes32 y) = _pub(KEY_B);
        address predicted = factory.getAddress(x, y, 7);
        assertEq(predicted.code.length, 0);
        assertEq(factory.createAccount(x, y, 7), predicted);
        assertEq(factory.createAccount(x, y, 7), predicted);
        assertGt(predicted.code.length, 0);
    }

    function test_goodSignatureValidates() public {
        bytes32 hash = keccak256("op");
        assertEq(_validate(_sign(KEY_A, keyIdA, hash), hash), 0);
    }

    function test_badSignaturesFail() public {
        bytes32 hash = keccak256("op");
        // signed by another key under the owner's id
        assertEq(_validate(_sign(KEY_B, keyIdA, hash), hash), 1);
        // signature over a different hash
        assertEq(_validate(_sign(KEY_A, keyIdA, keccak256("other")), hash), 1);
        // unknown key id
        assertEq(_validate(_sign(KEY_A, bytes32(uint256(1)), hash), hash), 1);
        // wrong length
        assertEq(_validate(hex"1234", hash), 1);
    }

    function test_highSIsAccepted() public {
        bytes32 hash = keccak256("op");
        (bytes32 r, bytes32 s) = vm.signP256(KEY_A, sha256(abi.encodePacked(hash)));
        bytes32 flipped = bytes32(P256_N - uint256(s));
        assertEq(_validate(abi.encodePacked(keyIdA, r, flipped), hash), 0);
    }

    function test_onlyEntryPointValidatesAndExecutes() public {
        bytes memory sig = _sign(KEY_A, keyIdA, bytes32(0));
        vm.expectRevert(ConsortiumAccount.NotAuthorized.selector);
        account.validateUserOp(_op(sig), bytes32(0), 0);
        vm.expectRevert(ConsortiumAccount.NotAuthorized.selector);
        account.execute(address(target), 0, abi.encodeCall(Target.set, (1)));
        vm.prank(address(0xBAD));
        vm.expectRevert(ConsortiumAccount.NotAuthorized.selector);
        account.executeBatch(new ConsortiumAccount.Call[](0));
    }

    function test_entryPointExecutesAndBatches() public {
        vm.startPrank(ENTRY_POINT);
        account.execute(address(target), 0, abi.encodeCall(Target.set, (5)));
        assertEq(target.value(), 5);
        ConsortiumAccount.Call[] memory calls = new ConsortiumAccount.Call[](2);
        calls[0] = ConsortiumAccount.Call(address(target), 0, abi.encodeCall(Target.set, (6)));
        calls[1] = ConsortiumAccount.Call(address(target), 0, abi.encodeCall(Target.set, (7)));
        account.executeBatch(calls);
        vm.stopPrank();
        assertEq(target.value(), 7);
    }

    function test_ownerManagementIsSelfCallOnly() public {
        (bytes32 x, bytes32 y) = _pub(KEY_B);
        vm.expectRevert(ConsortiumAccount.NotAuthorized.selector);
        account.addOwner(x, y);
        vm.prank(ENTRY_POINT);
        vm.expectRevert(ConsortiumAccount.NotAuthorized.selector);
        account.removeOwner(keyIdA);
    }

    function test_ownerWindows() public {
        (bytes32 x, bytes32 y) = _pub(KEY_B);
        bytes32 keyIdB = keccak256(abi.encodePacked(x, y));
        vm.warp(2_000_000);
        _selfCall(abi.encodeCall(ConsortiumAccount.addOwner, (x, y)));
        (, , uint64 addedAt, uint64 removedAt) = account.ownerInfo(keyIdB);
        assertEq(addedAt, 2_000_000);
        assertEq(removedAt, 0);
        assertEq(account.ownerIds().length, 2);

        bytes32 hash = keccak256("op");
        assertEq(_validate(_sign(KEY_B, keyIdB, hash), hash), 0);

        vm.warp(3_000_000);
        _selfCall(abi.encodeCall(ConsortiumAccount.removeOwner, (keyIdA)));
        (, , addedAt, removedAt) = account.ownerInfo(keyIdA);
        assertEq(addedAt, 1_000_000);
        assertEq(removedAt, 3_000_000);
        // the removed key keeps its record but can no longer sign
        assertEq(_validate(_sign(KEY_A, keyIdA, hash), hash), 1);
        assertEq(_validate(_sign(KEY_B, keyIdB, hash), hash), 0);
    }

    function test_duplicateOwnerReverts() public {
        (bytes32 x, bytes32 y) = _pub(KEY_A);
        vm.prank(ENTRY_POINT);
        vm.expectRevert(ConsortiumAccount.OwnerExists.selector);
        account.execute(address(account), 0, abi.encodeCall(ConsortiumAccount.addOwner, (x, y)));
    }

    function test_lastOwnerCannotBeRemoved() public {
        vm.prank(ENTRY_POINT);
        vm.expectRevert(ConsortiumAccount.LastOwner.selector);
        account.execute(address(account), 0, abi.encodeCall(ConsortiumAccount.removeOwner, (keyIdA)));
    }

    function test_removingAnUnknownOwnerReverts() public {
        vm.prank(ENTRY_POINT);
        vm.expectRevert(ConsortiumAccount.OwnerUnknown.selector);
        account.execute(address(account), 0, abi.encodeCall(ConsortiumAccount.removeOwner, (bytes32(uint256(9)))));
    }
}
