export type RequestKind = 'CURRENT' | 'PAST';
export type RequestStatus = 'PENDING' | 'ISSUED' | 'DECLINED' | 'REJECTED';

export interface VaultRequest {
  id: string;
  employer: string;
  employeeRef: string;
  kind: RequestKind;
  /** Name of the sign key in the keystore. */
  keyName: string;
  createdAt: number;
  status: RequestStatus;
  /** Non-extractable ECDH key; dropped once the delivery is stored. */
  encPrivateKey?: CryptoKey;
  /** Why the last delivery could not be stored; a sentence for the holder. */
  error?: string;
}

export interface VaultCertificate {
  id: string;
  sdJwt: string;
  credentialHash: string;
  employer: string;
  employerName: string;
  kind: RequestKind;
  keyName: string;
  receivedAt: number;
}
