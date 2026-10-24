export function extractSealedJwt(_pdf: Uint8Array): { jwt: string; regionStart: number } | null {
  throw new Error('not implemented: A2-S2');
}

export function verifySeal(_pdf: Uint8Array, _expectedDigest: string): boolean {
  throw new Error('not implemented: A2-S2');
}
