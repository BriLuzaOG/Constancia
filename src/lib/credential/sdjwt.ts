import type { Es256Signer } from './keys';
import type { Address, DisclosedClaims, EmploymentRecord, Hex, P256Jwk } from './types';

export interface IssuedCredential {
  sdJwt: string; // issuance form, all disclosures
  issuerJwt: string;
  credentialHash: Hex;
  did: string;
  account: Address;
  keyId: Hex;
  validUntil: string | null;
  claims: DisclosedClaims; // everything, for the holder's own screen
}

export async function issueCredential(_args: {
  record: EmploymentRecord;
  issuer: { did: string; keyId: Hex };
  signer: Es256Signer;
  holderJwk: P256Jwk;
  appUrl: string;
  now?: Date;
}): Promise<IssuedCredential> {
  throw new Error('not implemented: A2-S1');
}

export function credentialHashOf(_issuerJwt: string): Hex {
  throw new Error('not implemented: A2-S1');
}
