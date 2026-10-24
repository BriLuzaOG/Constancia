// Isomorphic (browser, Node scripts). Memory client is A3-S2; chain client is A3-S6.
import type { Es256Signer } from '../credential/keys';
import type { Address, Hex, P256Jwk } from '../credential/types';

export interface TxResult {
  txHash: Hex;
  blockNumber: number;
  feeWei: '0';
  elapsedMs: number;
}
export interface AccountClient {
  readonly address: Address;
  readonly signer: Es256Signer;
  applyForAccreditation(name: string): Promise<TxResult>;
  anchor(credentialHash: Hex): Promise<TxResult>; // keyId = signer.keyId
  revoke(credentialHash: Hex): Promise<TxResult>;
  addKey(jwk: P256Jwk): Promise<TxResult>;
  removeKey(keyId: Hex): Promise<TxResult>;
  approve(issuer: Address): Promise<TxResult>; // consortium member accounts
  suspend(issuer: Address): Promise<TxResult>;
}

// account: omit to use the counterfactual account of signer; pass it for a teammate's device
export async function createAccountClient(_args: {
  signer: Es256Signer;
  account?: Address;
  salt?: bigint;
}): Promise<AccountClient> {
  throw new Error('not implemented: A3-S2 (memory) / A3-S6 (chain)');
}
