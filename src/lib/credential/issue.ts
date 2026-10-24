import type {
  DigestSigner,
  GraduateRecord,
  Hex,
  IssuerInfo,
  SealedCredential,
} from '@/lib/credential/types';

export async function createSealedCredentialPdf(_args: {
  record: GraduateRecord;
  issuer: IssuerInfo;
  credentialId: Hex;
  sign: DigestSigner;
  verifyUrl: string;
  issuedAt?: Date;
  onProgress?: (stage: 'sealed' | 'signed', measured: string) => void;
}): Promise<SealedCredential> {
  throw new Error('not implemented: A2-S2');
}
