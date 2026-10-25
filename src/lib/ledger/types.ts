import type { Address, Hex, P256Jwk } from '../credential/types';

export type IssuerStatus = 'NONE' | 'PENDING' | 'ACTIVE' | 'SUSPENDED';
export interface IssuerInfo {
  account: Address;
  name: string;
  status: IssuerStatus;
  approvals: number;
  quorum: number;
  accreditedAt: number | null;
}
export interface KeyInfo {
  keyId: Hex;
  jwk: P256Jwk;
  addedAt: number;
  removedAt: number | null;
}
export interface RecordInfo {
  credentialHash: Hex;
  issuer: Address;
  keyId: Hex;
  anchoredAt: number;
  revokedAt: number | null;
  blockNumber: number;
}
export interface Head {
  number: number;
  time: number;
}
export interface NetworkState {
  chainId: number;
  head: Head;
  blockTimeSec: number;
  quorum: number;
  members: { account: Address; name: string }[];
  issuers: IssuerInfo[];
  blocks: { number: number; time: number; txCount: number }[]; // last 16
  anchors: { credentialHash: Hex; issuer: Address; blockNumber: number; time: number }[]; // last 10, hashes only
}
export interface LookupRequest {
  issuer: Address;
  keyId: Hex;
  credentialHash: Hex;
}
export interface LookupResponse {
  head: Head;
  issuer: IssuerInfo;
  key: KeyInfo | null;
  record: RecordInfo | null;
}

export interface LedgerReader {
  // server side; browsers go through /api/ledger/*
  head(): Promise<Head>;
  issuer(account: Address): Promise<IssuerInfo>;
  key(account: Address, keyId: Hex): Promise<KeyInfo | null>;
  keys(account: Address): Promise<KeyInfo[]>;
  record(issuer: Address, credentialHash: Hex): Promise<RecordInfo | null>;
  state(): Promise<NetworkState>;
  accountAddress(jwk: P256Jwk, salt?: bigint): Promise<Address>; // counterfactual
  isDeployed(account: Address): Promise<boolean>;
}

export class LedgerUnreachableError extends Error {}
