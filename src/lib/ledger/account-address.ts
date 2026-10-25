import { bytesToHex, encodePacked, keccak256, pad } from 'viem';
import { fromB64u } from '../credential/jws';
import type { Address, Hex, P256Jwk } from '../credential/types';

const toBytes32 = (coordinate: string): Hex => pad(bytesToHex(fromB64u(coordinate)), { size: 32 });

export const jwkCoordinates = (jwk: P256Jwk) => ({ x: toBytes32(jwk.x), y: toBytes32(jwk.y) });

/** Memory-ledger stand-in for the factory's CREATE2 address: a deterministic hash of key and salt. */
export function memoryAccountAddress(jwk: P256Jwk, salt: bigint = BigInt(0)): Address {
  const { x, y } = jwkCoordinates(jwk);
  const hash = keccak256(encodePacked(['bytes32', 'bytes32', 'uint256'], [x, y, salt]));
  return `0x${hash.slice(-40)}`;
}
