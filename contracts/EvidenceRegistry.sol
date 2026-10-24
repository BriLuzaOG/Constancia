// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title EvidenceRegistry
/// @notice Guarda la raíz Merkle de cada intervalo. No guarda eventos:
///         la cadena prueba qué debe existir, no el contenido.
contract EvidenceRegistry {
    event RootAnchored(bytes32 indexed root, string sessionId, uint256 timestamp);

    mapping(bytes32 => uint256) public anchoredAt;

    function anchor(bytes32 root, string calldata sessionId) external {
        anchoredAt[root] = block.timestamp;
        emit RootAnchored(root, sessionId, block.timestamp);
    }
}
