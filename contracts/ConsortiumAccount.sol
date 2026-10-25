// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IAccount, PackedUserOperation, ENTRY_POINT} from "./interfaces/IEntryPoint.sol";
import {P256Verifier} from "./vendor/P256Verifier.sol";

// Smart account controlled by P-256 device keys. It never holds ETH: the paymaster pays every fee.
contract ConsortiumAccount is IAccount {
    struct Call {
        address target;
        uint256 value;
        bytes data;
    }

    struct Owner {
        bytes32 x;
        bytes32 y;
        uint64 addedAt;
        uint64 removedAt;
    }

    uint256 private constant SIG_VALIDATION_FAILED = 1;

    mapping(bytes32 keyId => Owner) private owners;
    bytes32[] private ids;
    uint256 private liveOwners;

    error NotAuthorized();
    error OwnerExists();
    error OwnerUnknown();
    error LastOwner();

    constructor(bytes32 x, bytes32 y) {
        _addOwner(x, y);
    }

    modifier onlyEntryPointOrSelf() {
        if (msg.sender != ENTRY_POINT && msg.sender != address(this)) revert NotAuthorized();
        _;
    }

    modifier onlySelf() {
        if (msg.sender != address(this)) revert NotAuthorized();
        _;
    }

    function execute(address target, uint256 value, bytes calldata data) external onlyEntryPointOrSelf {
        _call(target, value, data);
    }

    function executeBatch(Call[] calldata calls) external onlyEntryPointOrSelf {
        for (uint256 i = 0; i < calls.length; i++) {
            _call(calls[i].target, calls[i].value, calls[i].data);
        }
    }

    function addOwner(bytes32 x, bytes32 y) external onlySelf {
        _addOwner(x, y);
    }

    function removeOwner(bytes32 keyId) external onlySelf {
        Owner storage owner = owners[keyId];
        if (owner.addedAt == 0 || owner.removedAt != 0) revert OwnerUnknown();
        if (liveOwners == 1) revert LastOwner();
        owner.removedAt = uint64(block.timestamp);
        liveOwners--;
    }

    function ownerInfo(bytes32 keyId) external view returns (bytes32 x, bytes32 y, uint64 addedAt, uint64 removedAt) {
        Owner storage owner = owners[keyId];
        return (owner.x, owner.y, owner.addedAt, owner.removedAt);
    }

    function ownerIds() external view returns (bytes32[] memory) {
        return ids;
    }

    // signature = abi.encodePacked(bytes32 keyId, bytes32 r, bytes32 s) over sha256(userOpHash).
    // missingAccountFunds is ignored on purpose: with a paymaster the account owes nothing.
    function validateUserOp(PackedUserOperation calldata userOp, bytes32 userOpHash, uint256)
        external
        view
        returns (uint256)
    {
        if (msg.sender != ENTRY_POINT) revert NotAuthorized();
        if (userOp.signature.length != 96) return SIG_VALIDATION_FAILED;
        bytes32 keyId = bytes32(userOp.signature[0:32]);
        Owner storage owner = owners[keyId];
        if (owner.addedAt == 0 || owner.removedAt != 0) return SIG_VALIDATION_FAILED;
        bytes32 digest = sha256(abi.encodePacked(userOpHash));
        bool valid = P256Verifier.verify(
            digest,
            uint256(bytes32(userOp.signature[32:64])),
            uint256(bytes32(userOp.signature[64:96])),
            [uint256(owner.x), uint256(owner.y)]
        );
        return valid ? 0 : SIG_VALIDATION_FAILED;
    }

    function _addOwner(bytes32 x, bytes32 y) private {
        bytes32 keyId = keccak256(abi.encodePacked(x, y));
        if (owners[keyId].addedAt != 0) revert OwnerExists();
        owners[keyId] = Owner(x, y, uint64(block.timestamp), 0);
        ids.push(keyId);
        liveOwners++;
    }

    function _call(address target, uint256 value, bytes calldata data) private {
        (bool ok, bytes memory ret) = target.call{value: value}(data);
        if (!ok) {
            assembly ("memory-safe") {
                revert(add(ret, 32), mload(ret))
            }
        }
    }
}
