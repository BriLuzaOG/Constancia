import type { SecpJwk } from '@/lib/credential/types';
import type { AnchorInfo } from '@/lib/chain/anchor';

export interface DidVerificationMethod {
  id: string;
  type: 'JsonWebKey2020';
  controller: string;
  publicKeyJwk: SecpJwk;
}

export interface DidDocument {
  '@context': string[];
  id: string;
  verificationMethod: DidVerificationMethod[];
  assertionMethod: string[];
}

export interface LookupRequest {
  did: string;
  kid: string;
  credentialId: string;
}

export interface LookupResponse {
  didDocument: DidDocument;
  resolvedFrom: string;
  issuerAddress: `0x${string}`;
  anchor: AnchorInfo;
}
