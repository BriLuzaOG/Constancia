export type RequestKind = 'CURRENT' | 'PAST';
export type RequestStatus = 'PENDING' | 'ISSUED' | 'DECLINED';

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
