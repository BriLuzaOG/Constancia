import type { Address, P256Jwk } from '../credential/types';
import type { IssuerInfo, KeyInfo } from './types';

export const LEDGER_CHAIN_ID = 11155111;
const DID_PATTERN = /^did:constancia:(\d+):(0x[0-9a-fA-F]{40})$/;

export function parseDid(did: string): { chainId: number; account: Address } | null {
  const match = DID_PATTERN.exec(did);
  return match ? { chainId: Number(match[1]), account: match[2]!.toLowerCase() as Address } : null;
}

const publicJwk = ({ x, y }: P256Jwk): P256Jwk => ({ kty: 'EC', crv: 'P-256', x, y });

/** Only live keys are verification methods; removed keys stay in the ledger history. */
export function buildDidDocument(did: string, issuer: IssuerInfo, keys: KeyInfo[]) {
  const live = keys.filter((key) => key.removedAt === null);
  const ids = live.map((key) => `${did}#${key.keyId}`);
  return {
    '@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/suites/jws-2020/v1'],
    id: did,
    verificationMethod: live.map((key, index) => ({
      id: ids[index],
      type: 'JsonWebKey2020',
      controller: did,
      publicKeyJwk: publicJwk(key.jwk),
    })),
    assertionMethod: ids,
    didDocumentMetadata: { accredited: issuer.status === 'ACTIVE', name: issuer.name },
  };
}
