// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ConsortiumAccount} from "./ConsortiumAccount.sol";

// CREATE2 factory: the address of an account is a function of (x, y, salt), known before deployment.
contract AccountFactory {
    function getAddress(bytes32 x, bytes32 y, uint256 salt) public view returns (address) {
        bytes32 initCodeHash = keccak256(abi.encodePacked(type(ConsortiumAccount).creationCode, abi.encode(x, y)));
        return address(
            uint160(uint256(keccak256(abi.encodePacked(bytes1(0xff), address(this), bytes32(salt), initCodeHash))))
        );
    }

    // Idempotent: the EntryPoint calls it through initCode, and a replay must not revert.
    function createAccount(bytes32 x, bytes32 y, uint256 salt) external returns (address account) {
        account = getAddress(x, y, salt);
        if (account.code.length > 0) return account;
        new ConsortiumAccount{salt: bytes32(salt)}(x, y);
    }
}
