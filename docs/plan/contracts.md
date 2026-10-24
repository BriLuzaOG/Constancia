# ScholarKey — Shared contracts

The single source of truth for every interface between agents. **A1-S0 commits these as typed stubs
before anyone else starts.** Change a contract only by editing this file and the stub in the same
commit, and tell the team in chat. Every module listed here has exactly one owner (see the README
ownership map). Others import it; they never edit it.

---

## 1. Architecture in one picture

```mermaid
flowchart LR
  subgraph AdminBrowser[Registrar browser /issuer]
    F[Graduate form<br/>data never leaves] --> B[build PDF + seal + VC]
    B --> S[Privy secp256k1_sign<br/>ES256K, no popup]
    S --> T[anchor tx via Privy<br/>showWalletUIs:false]
  end
  subgraph Server[Next.js server]
    P[/api/issuance/prepare/]
    G[/api/gas/sponsor/ JIT/]
    C[/api/issuance/confirm/]
    L[/api/verify/lookup/<br/>SSRF-guarded did:web]
    DB[(Postgres<br/>institutions + blind index)]
  end
  subgraph Chain[Base Sepolia]
    K[CredentialAnchor.sol]
  end
  U[University domain<br/>/.well-known/did.json]
  subgraph VerifierBrowser[Recruiter browser /verify]
    V[extract JWT → check sig → check seal<br/>all local]
  end
  F -. no PII .-> P
  B --> P
  T --> G
  G -->|exact ETH top-up| T
  T --> K
  T --> C
  P & G & C --> DB
  V -->|did, kid, credentialId only| L
  L --> U
  L --> K
```

**Decision vs. the proposal:** issuance runs in the registrar's browser. The graduate's data never
reaches our server at all (stronger than "processed, then discarded"). The server only hands out a
random credential ID, sponsors gas, and records a blind index row. Signing must happen client-side
anyway, because the Privy embedded wallet only signs inside the admin's authenticated session.

---

## 2. Folder layout and owners

```
contracts/CredentialAnchor.sol                 A3
scripts/contracts/{compile,deploy,smoke}.ts    A3
scripts/check-demo.ts                          A3
prisma/schema.prisma, prisma.config.ts         A4
university-site/                               A1   (static site of the demo university)
public/contexts/scholarkey-v1.jsonld           A2
public/demo/                                   A4   (synthetic sample diploma for the lab)
src/app/layout.tsx, globals.css, page.tsx      A1   (landing at /)
src/app/_landing/                              A1
src/app/dev/kit/                               A1   (design kit page, dev reference)
src/app/dev/privy/                             A3   (Privy spike page, dev only)
src/app/issuer/**                              A4
src/app/verify/**                              A5   (/verify and /verify/lab)
src/app/api/issuer/**, api/issuance/**         A4
src/app/api/gas/sponsor/route.ts               A3
src/app/api/verify/lookup/route.ts             A5
src/components/ui/                             A1   (primitives everyone uses)
src/lib/env.ts                                 A1   (A1-S0, then append-only by owners)
src/lib/handoff.ts                             A1   (landing → /verify file handoff)
src/lib/credential/                            A2
src/lib/did/                                   A5
src/lib/chain/                                 A3
src/lib/privy/                                 A3
src/lib/db.ts, src/lib/issuer/                 A4
src/generated/prisma/                          generated, gitignored
```

---

## 3. Identifiers and formats

| Thing | Format | Example |
| --- | --- | --- |
| `Hex` | `` `0x${string}` `` lowercase | `0x7f3a…` |
| Credential ID | `0x` + 64 hex, **256 random bits**, generated server-side in `prepare` | `0x7f3a…c41e` |
| VC `id` | `urn:scholarkey:<credentialId>` | |
| Institution DID | `did:web:<domain>` (path form allowed: `did:web:host:a:b`) | `did:web:waraira-university.onrender.com` |
| Key id (`kid`) | `<did>#key-1` | |
| JWK | `{ kty:'EC', crv:'secp256k1', x, y }` base64url 32-byte coords | |
| Issuer address | `publicKeyToAddress(jwk)` (viem). It is also the Privy wallet address | |

A random 256-bit ID is strictly stronger than the proposal's "hash with nonce": nothing about the
student can be inferred from it or brute-forced back out of it.

---

## 4. Credential (A2 owns `src/lib/credential/`)

### 4.1 Types: `src/lib/credential/types.ts`

```ts
export type Hex = `0x${string}`;

/** Lives only in the registrar's browser. Never sent to any server. */
export interface GraduateRecord {
  fullName: string;          // "María Fernanda Rojas"
  nationalId: string;        // "V-24.567.890"
  program: string;           // "Computer Engineering"
  degreeLevel: 'Technician' | 'Bachelor' | 'Master' | 'Doctorate';
  graduationDate: string;    // "2026-07-15" (ISO date)
  honors?: string;           // "Summa Cum Laude"
}

export interface IssuerInfo { did: string; name: string; kid: string }

export interface SecpJwk { kty: 'EC'; crv: 'secp256k1'; x: string; y: string }

/** Signs a 32-byte SHA-256 digest. Returns 64-byte compact r||s (low-s). */
export type DigestSigner = (digest: Uint8Array) => Promise<Uint8Array>;

export interface GraduationCredential {
  '@context': ['https://www.w3.org/ns/credentials/v2', string /* <APP_URL>/contexts/scholarkey-v1.jsonld */];
  id: string;                                  // urn:scholarkey:<credentialId>
  type: ['VerifiableCredential', 'GraduationCredential'];
  issuer: { id: string; name: string };
  validFrom: string;                           // ISO datetime
  credentialSubject: {
    type: 'Graduate';
    name: string;
    nationalId: string;
    degree: { type: GraduateRecord['degreeLevel']; name: string; honors?: string };
    graduationDate: string;
  };
  documentSeal: { alg: 'sha-256'; digest: string /* base64url */; region: 8192 };
}

export interface SealedCredential { pdf: Uint8Array; jwt: string; credentialId: Hex; sealDigest: string }
```

`graduateRecordSchema` (zod 4) lives next to the types and is used by the issuer form.

### 4.2 JWT

- Header: `{ "alg": "ES256K", "typ": "vc+jwt", "kid": "<did>#key-1" }`.
- Payload: the `GraduationCredential` object plus `iat`. VC-JOSE-COSE style: the payload *is* the VC.
- Signing input: `b64url(header) + "." + b64url(payload)`. Digest = `sha256(signingInput)`.
- Signature: 64-byte `r||s`, base64url. Verify with `@noble/curves` secp256k1 against the JWK.
  Note: noble v2 hashes the message by default, so pass the digest with `prehash: false` or pass the
  raw signing input. Read the noble v2 README.
- `jose` is used for base64url and decoding (`decodeProtectedHeader`, `decodeJwt`). jose does not sign
  ES256K. That is noble's job.

### 4.3 PDF seal (byte-range seal; the same idea as PDF digital signatures)

1. Render the certificate with pdf-lib.
2. Add an **uncompressed** embedded-file stream (`context.stream(...)`, not `attach()`, because
   `attach()` compresses):
   - content: exactly **8192 bytes of ASCII space (0x20)**;
   - dict: `/Type /EmbeddedFile /Subtype /application#2Fjwt /ScholarKeySeal true`;
   - filespec `scholarkey-credential.jwt`, listed in `Names/EmbeddedFiles` and the catalog `/AF`, so
     viewers show it as an attachment.
3. `save({ useObjectStreams: false })` gives **B**. `sealDigest = b64url(sha256(B))`.
4. Build the VC with `documentSeal.digest = sealDigest`, sign it, and get the JWT (must be ≤ 8192 bytes; assert).
5. Write the JWT bytes into the 8192-byte region of B, left-aligned, keeping the space padding. That
   is the final PDF.

**Locate the region:** find the byte string `/ScholarKeySeal true`, then the next `stream` keyword,
skip its EOL (`\r\n` or `\n`). The region is the next 8192 bytes.
**Extract:** region bytes → ASCII → trim → JWT.
**Verify the seal:** copy the file, fill the region with spaces, sha256, compare with
`documentSeal.digest`. Any edit outside the region (text, images, metadata, a re-save) breaks it.
Edits inside the region (token tampering) leave the seal intact and break the signature instead.

### 4.4 Public functions

```ts
// src/lib/credential/issue.ts
export function createSealedCredentialPdf(args: {
  record: GraduateRecord;
  issuer: IssuerInfo;
  credentialId: Hex;
  sign: DigestSigner;
  verifyUrl: string;          // `${APP_URL}/verify`
  issuedAt?: Date;
  onProgress?: (stage: 'sealed' | 'signed', measured: string) => void; // drives the issuer's rows
}): Promise<SealedCredential>;

// src/lib/credential/es256k.ts
export function verifyJwtSignature(jwt: string, jwk: SecpJwk): boolean;
export function jwkFromPublicKey(uncompressed: Uint8Array | Hex): SecpJwk;
export function addressFromJwk(jwk: SecpJwk): Hex;

// src/lib/credential/seal.ts
export function extractSealedJwt(pdf: Uint8Array): { jwt: string; regionStart: number } | null;
export function verifySeal(pdf: Uint8Array, expectedDigest: string): boolean;

// src/lib/credential/verify.ts
export function verifyCredential(pdf: Uint8Array, lookup: LookupFn): AsyncGenerator<CheckEvent, Verdict>;

// src/lib/credential/attacks.ts (Forgery Lab)
export interface Attack { id: 'edit-visual' | 'edit-token' | 'forge-signature'; title: string; changed: string }
export function runAttack(id: Attack['id'], pdf: Uint8Array): Promise<{ pdf: Uint8Array; attack: Attack }>;

// src/lib/credential/layout.ts: certificate coordinates, used by the visual attack
export const CERT_LAYOUT: Record<'name' | 'program' | 'honors' | 'date' | 'qr', { x: number; y: number; w: number; h: number }>;
```

### 4.5 Verification events (drive the verifier UI)

```ts
export type CheckCode = 'TOKEN' | 'ISSUER' | 'SIGNATURE' | 'SEAL' | 'ANCHOR';
export type CheckStatus = 'PENDING' | 'CHECKING' | 'VERIFIED' | 'FAILED' | 'UNAVAILABLE' | 'NOT_EXAMINED';

export interface CheckEvent {
  index: 1 | 2 | 3 | 4 | 5;    // TOKEN=1 ISSUER=2 SIGNATURE=3 SEAL=4 ANCHOR=5
  code: CheckCode;
  status: CheckStatus;
  measured?: string;           // "1,842 bytes" · "waraira-university.onrender.com" · "3.1 ms" · "212 KB hashed" · "block 18,442,107"
  detail?: string;             // human sentence, no jargon unless in technical details
  elapsedMs?: number;
}

export type Verdict =
  | { kind: 'AUTHENTIC'; credential: GraduationCredential; issuerDomain: string; anchor: AnchorInfo }
  | { kind: 'NOT_AUTHENTIC'; failedAt: CheckCode; reason: string }
  | { kind: 'UNAVAILABLE'; failedAt: 'ISSUER' | 'ANCHOR'; reason: string };  // domain or chain unreachable

export type LookupFn = (req: LookupRequest) => Promise<LookupResponse>;
```

Order is fixed: TOKEN → ISSUER → SIGNATURE → SEAL → ANCHOR. The pipeline stops at the first failure and
emits `NOT_EXAMINED` for the remaining checks (they stay visible, never hidden).

---

## 5. DID (A5 owns `src/lib/did/`)

```ts
export function domainToDidWeb(domain: string): string;          // "a.com" → "did:web:a.com"; ports → %3A
export function didWebToUrl(did: string): URL;                   // spec mapping, .well-known for bare domains
export function buildDidDocument(did: string, jwk: SecpJwk): DidDocument;
export function findAssertionKey(doc: DidDocument, kid: string): SecpJwk | null;

// server-only
export function resolveDidWeb(did: string): Promise<{ document: DidDocument; url: string }>;
export class DidUnreachableError extends Error {}   // timeout, DNS, 5xx → UNAVAILABLE
export class DidNotFoundError extends Error {}      // 404
export class DidInvalidError extends Error {}       // bad JSON, id mismatch, blocked by SSRF guard
```

`did.json` shape:

```json
{
  "@context": ["https://www.w3.org/ns/did/v1", "https://w3id.org/security/suites/jws-2020/v1"],
  "id": "did:web:waraira-university.onrender.com",
  "verificationMethod": [{
    "id": "did:web:waraira-university.onrender.com#key-1",
    "type": "JsonWebKey2020",
    "controller": "did:web:waraira-university.onrender.com",
    "publicKeyJwk": { "kty": "EC", "crv": "secp256k1", "x": "…", "y": "…" }
  }],
  "assertionMethod": ["did:web:waraira-university.onrender.com#key-1"]
}
```

SSRF guard (in `resolveDidWeb`): `https:` only; reject IP-literal hosts; DNS-resolve and reject
private, loopback, link-local, CGNAT and ULA ranges (v4 and v6); `redirect: 'manual'` (a redirect is
an error); 3 s `AbortSignal.timeout`; 64 KB body cap; zod-validate; `document.id === did`.

---

## 6. Chain (A3 owns `contracts/`, `src/lib/chain/`)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// Blind anchor: random credential IDs only, never personal data.
/// Keyed by issuer, so nobody can front-run or squat another institution's IDs.
contract CredentialAnchor {
    mapping(address issuer => mapping(bytes32 credentialId => uint64 anchoredAt)) public anchoredAt;

    event CredentialAnchored(address indexed issuer, bytes32 indexed credentialId, uint64 anchoredAt);
    error AlreadyAnchored(bytes32 credentialId);

    function anchor(bytes32 credentialId) external {
        if (anchoredAt[msg.sender][credentialId] != 0) revert AlreadyAnchored(credentialId);
        anchoredAt[msg.sender][credentialId] = uint64(block.timestamp);
        emit CredentialAnchored(msg.sender, credentialId, uint64(block.timestamp));
    }
}
```

```ts
// src/lib/chain/anchor.ts (server-only)
export interface AnchorInfo { anchored: boolean; anchoredAt: number | null; txHash: Hex | null; explorerUrl: string | null }
export function readAnchor(issuer: Hex, credentialId: Hex): Promise<AnchorInfo>;

// src/lib/chain/sponsor.ts (server-only)
export interface SponsorResult {
  fundingTxHash: Hex | null;   // null when the wallet already had enough
  topUpWei: string;
  gas: string; maxFeePerGas: string; maxPriorityFeePerGas: string;
}
export function sponsorAnchorGas(admin: Hex, credentialId: Hex): Promise<SponsorResult>;
```

Base is an OP-stack chain: total fee = L2 execution + **L1 data fee**. Use viem's
`publicActionsL2()` (`viem/op-stack`) to estimate both. Top-up = (gas × maxFeePerGas + L1 fee) × 1.2 −
current balance, floored at 0.

---

## 7. Privy (A3 owns `src/lib/privy/`)

```ts
// client
export function IssuerProviders(props: { children: React.ReactNode }): React.ReactNode; // PrivyProvider config
export function usePrivySigner(): {
  ready: boolean;
  address: Hex | null;
  sign: DigestSigner;  // provider.request({ method: 'secp256k1_sign', params: [digestHex] }) → r||s
  proveKey(): Promise<{ jwk: SecpJwk; proof: { digest: Hex; signature: Hex } }>; // recoverPublicKey
};
export function useAnchorCredential(): (credentialId: Hex) => Promise<{
  fundingTxHash: Hex | null; anchorTxHash: Hex; blockNumber: string; topUpWei: string;
}>;
export function issuerFetch<T>(path: string, body?: unknown): Promise<T>; // adds Bearer access token

// server
export function requireAdmin(req: Request): Promise<{ privyUserId: string; walletAddress: Hex }>; // throws HttpError(401)
export class HttpError extends Error { constructor(public status: number, public code: string, message?: string) }
```

Privy config: `loginMethods: ['email']`, `embeddedWallets.ethereum.createOnLogin: 'users-without-wallets'`,
`embeddedWallets.showWalletUIs: false`, `defaultChain` and `supportedChains: [baseSepolia]`. Wallet
words never appear in the UI.

---

## 8. HTTP API

All bodies are JSON, all inputs are zod-validated, and errors use `{ error: CODE, message }`. Admin
routes need `Authorization: Bearer <privy access token>` (use `issuerFetch`).

| Route | Owner | Request | 200 response | Errors |
| --- | --- | --- | --- | --- |
| `POST /api/verify/lookup` (public) | A5 | `{ did, kid, credentialId }` | `{ didDocument, resolvedFrom, issuerAddress, anchor: AnchorInfo }` | 400 `BAD_REQUEST` · 404 `DID_NOT_FOUND` · 422 `DID_INVALID` · 422 `KEY_NOT_FOUND` · 503 `ISSUER_UNREACHABLE` · 503 `CHAIN_UNREACHABLE` |
| `GET /api/issuer/me` | A4 | — | `{ institution: InstitutionDTO \| null, readiness: { identity: true, didPublished: boolean, subscriptionActive: boolean } }` | 401 |
| `POST /api/issuer/institution` | A4 | `{ name, domain, jwk, proof: { digest, signature } }` | `{ institution: InstitutionDTO, didDocument }` | 401 · 409 `DOMAIN_TAKEN` · 422 `KEY_PROOF_INVALID` |
| `POST /api/issuer/did/check` | A4 | — | `{ verified: boolean, url, found: SecpJwk \| null, expected: SecpJwk }` | 401 · 503 `ISSUER_UNREACHABLE` |
| `POST /api/issuer/subscription` | A4 | `{ active: boolean }` | `{ subscriptionActive }` | 401 |
| `POST /api/issuance/prepare` | A4 | `{}` | `{ credentialId, issuer: IssuerInfo, verifyUrl }` | 401 · 402 `SUBSCRIPTION_INACTIVE` · 409 `DID_NOT_VERIFIED` |
| `POST /api/gas/sponsor` | A3 | `{ credentialId }` | `SponsorResult` | 401 · 402 · 404 `UNKNOWN_CREDENTIAL` · 409 `ALREADY_ANCHORED` |
| `POST /api/issuance/confirm` | A4 | `{ credentialId, anchorTxHash, fundingTxHash? }` | `{ stored: IssuanceRow }` (the full blind row, for the "what we stored" receipt) | 401 · 404 · 422 `ANCHOR_NOT_FOUND` |

`LookupRequest`/`LookupResponse` are the request/200 shapes of `/api/verify/lookup`.
The verify page records the exact bytes it sends to that route for the privacy receipt.

---

## 9. Database (A4 owns `prisma/`)

```prisma
model Institution {
  id                 String    @id @default(cuid())
  privyUserId        String    @unique            // one admin per institution in the MVP
  name               String
  domain             String    @unique
  did                String    @unique
  walletAddress      String
  publicKeyJwk       Json
  didVerifiedAt      DateTime?
  subscriptionActive Boolean   @default(false)
  createdAt          DateTime  @default(now())
  issuances          Issuance[]
}

enum IssuanceStatus { PREPARED ANCHORED }

/// Blind index: no names, no IDs, no grades, no JWT. Ever.
model Issuance {
  credentialId  String         @id
  institutionId String
  institution   Institution    @relation(fields: [institutionId], references: [id])
  status        IssuanceStatus @default(PREPARED)
  fundingTxHash String?
  anchorTxHash  String?
  createdAt     DateTime       @default(now())
  anchoredAt    DateTime?
}
```

Guards (`src/lib/issuer/guards.ts`, A4), also used by A3's sponsor route:

```ts
export function getInstitutionForAdmin(privyUserId: string): Promise<Institution | null>;
export function assertCanIssue(privyUserId: string): Promise<Institution>;                 // 402 / 409
export function assertPreparedCredential(privyUserId: string, credentialId: Hex): Promise<Issuance>; // 404 / 409
```

---

## 10. Environment (`src/lib/env.ts`, A1-S0)

Parse **lazily**, on first use, never at import. CI builds without secrets.

| Var | Side | Owner of the value |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | client | human (Render URL) |
| `NEXT_PUBLIC_PRIVY_APP_ID` | client | human (Privy dashboard) |
| `PRIVY_APP_SECRET` | server | human |
| `DATABASE_URL` | server | human (Neon/Render Postgres) |
| `BASE_SEPOLIA_RPC_URL` | server | human (Alchemy, or `https://sepolia.base.org`) |
| `NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL` | client | same RPC, used for client receipt waits |
| `SPONSOR_PRIVATE_KEY` | server | A3 generates, human funds from a faucet |
| `NEXT_PUBLIC_ANCHOR_CONTRACT_ADDRESS` | client | A3 after deploy |
| `ANCHOR_DEPLOY_BLOCK` | server | A3 after deploy (lower bound for log queries) |

`.env.example` lists them all. Real values travel by private channel, never git.

---

## 11. UI primitives (A1 owns `src/components/ui/`)

A1-S0 commits these as **typed stubs with plain markup**. A1-S1 gives them the visual world. Everyone
else imports them and never restyles them locally. Missing a variant? Ask A1.

```ts
// check-list.tsx: the five verifier checks AND the issuance steps use the same component
export type RowStatus = 'PENDING' | 'CHECKING' | 'VERIFIED' | 'FAILED' | 'UNAVAILABLE' | 'NOT_EXAMINED' | 'DONE';
export function CheckList(props: { title?: string; children: React.ReactNode }): React.ReactNode;
export function CheckRow(props: {
  index: number; label: string; status: RowStatus;
  measured?: string; detail?: string; href?: string; // href = explorer link for chain rows
}): React.ReactNode;

// line-field.tsx: the signature material (see DESIGN.md / landing surface brief)
export type LineFieldState = 'rest' | 'scanning' | 'resolved-ok' | 'resolved-fail' | 'resolved-unavailable';
export function LineField(props: { state?: LineFieldState; progress?: number /* 0–5 */; interactive?: boolean; className?: string; children?: React.ReactNode }): React.ReactNode;

// verdict.tsx
export function Verdict(props: { kind: 'AUTHENTIC' | 'NOT_AUTHENTIC' | 'UNAVAILABLE'; title: string; reason?: string; issuerDomain?: string }): React.ReactNode;

// drop-zone.tsx: whole-page drag awareness, keyboard and file-input fallback, PDF only
export function DropZone(props: { onFile: (file: File) => void; label: string; hint?: string; disabled?: boolean }): React.ReactNode;

// receipt.tsx: "what left your browser" / "what we stored"
export function Receipt(props: { title: string; rows: { label: string; value: string; mono?: boolean; muted?: boolean }[]; footnote?: string }): React.ReactNode;

// basics
export function Button(props: React.ComponentProps<'button'> & { variant?: 'primary' | 'secondary' | 'quiet'; asChild?: never }): React.ReactNode;
export function LinkButton(props: React.ComponentProps<'a'> & { variant?: 'primary' | 'secondary' | 'quiet' }): React.ReactNode;
export function Field(props: { label: string; hint?: string; error?: string; children: React.ReactNode }): React.ReactNode; // wraps <input>/<select>
export function Panel(props: { title?: string; children: React.ReactNode; tone?: 'default' | 'quiet' }): React.ReactNode;
export function Mono(props: { value: string; shorten?: boolean; copy?: boolean }): React.ReactNode;  // hashes, DIDs, IDs
export function Disclosure(props: { summary: string; children: React.ReactNode }): React.ReactNode;  // "Technical details"
export function PageHeader(props: { kicker?: string; title: string; lead?: string; actions?: React.ReactNode }): React.ReactNode;
```

`src/lib/handoff.ts` (A1): `setHandoffFile(file: File)` / `takeHandoffFile(): File | null`, an in-memory
module variable that carries a file dropped on `/` to `/verify` across client navigation.
