// Dev and test scaffolding with the same semantics as Ledger.sol and ConsortiumAccount.sol.
// Never runs in production; nothing fake is deployed.
import { fromB64u } from '../credential/jws';
import { keyIdOf, verifyEs256 } from '../credential/keys';
import type { Address, Hex, P256Jwk, P256PrivateJwk } from '../credential/types';
import { memoryAccountAddress } from './account-address';
import roster from './members.json';
import {
  LedgerOpError,
  memoryCallSchema,
  opMessage,
  type MemoryCall,
  type SignedOp,
} from './memory-ops';
import type {
  Head,
  IssuerInfo,
  IssuerStatus,
  KeyInfo,
  LedgerReader,
  NetworkState,
  RecordInfo,
} from './types';

export const BLOCK_TIME_SEC = 12;
const CHAIN_ID = 11155111;
const FIRST_BLOCK = 7_000_000;
const RECENT_BLOCKS = 16;
const RECENT_ANCHORS = 10;
const MAX_REMEMBERED_NONCES = 5000;

interface Issuer {
  name: string;
  status: IssuerStatus;
  accreditedAt: number | null;
  approvals: Set<Address>;
  suspensions: Set<Address>;
}

export interface TxReceipt {
  txHash: Hex;
  blockNumber: number;
}

export interface DemoIdentity {
  name: string;
  jwk: P256PrivateJwk;
}

export type Clock = () => number; // unix seconds

const lower = (value: string) => value.toLowerCase() as Address;
const recordKey = (issuer: Address, credentialHash: Hex) => `${issuer}:${credentialHash}`;

async function newIdentity(name: string): Promise<DemoIdentity> {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
    'sign',
  ]);
  const { kty, crv, x, y, d } = await crypto.subtle.exportKey('jwk', pair.privateKey);
  return { name, jwk: { kty, crv, x, y, d } as P256PrivateJwk };
}

export class MemoryLedger {
  readonly members: { account: Address; name: string }[] = [];
  readonly quorum: number = roster.quorum;
  private readonly bootTime: number;
  private readonly accounts = new Map<Address, KeyInfo[]>();
  private readonly issuers = new Map<Address, Issuer>();
  private readonly issuerOrder: Address[] = [];
  private readonly records = new Map<string, RecordInfo>();
  private readonly anchorLog: RecordInfo[] = [];
  private readonly txPerBlock = new Map<number, number>();
  private readonly usedNonces = new Set<string>();

  constructor(private readonly clock: Clock = () => Math.floor(Date.now() / 1000)) {
    this.bootTime = clock();
  }

  head(): Head {
    const ticks = Math.floor((this.clock() - this.bootTime) / BLOCK_TIME_SEC);
    return { number: FIRST_BLOCK + ticks, time: this.bootTime + ticks * BLOCK_TIME_SEC };
  }

  /** Registers an account with one live owner key (what the factory does on a first operation). */
  deployAccount(jwk: P256Jwk, salt: bigint = BigInt(0)): Address {
    const account = memoryAccountAddress(jwk, salt);
    if (!this.accounts.has(account)) {
      this.accounts.set(account, [this.newKey(jwk)]);
    }
    return account;
  }

  /** Boot data: the consortium members and three accredited demo employers, with fresh keys. */
  async seed(): Promise<{ members: DemoIdentity[]; employers: DemoIdentity[] }> {
    const members = await Promise.all(roster.members.map(newIdentity));
    const employers = await Promise.all(roster.employers.map(newIdentity));
    for (const member of members) {
      this.members.push({ account: this.deployAccount(member.jwk), name: member.name });
    }
    for (const employer of employers) {
      const account = this.deployAccount(employer.jwk);
      this.applyForAccreditation(account, employer.name);
      for (const member of this.members.slice(0, this.quorum)) {
        this.approve(member.account, account);
      }
    }
    return { members, employers };
  }

  // --- the contract surface (sender is always an account address) ---

  applyForAccreditation(sender: Address, name: string): void {
    const length = new TextEncoder().encode(name).length;
    if (length === 0 || length > 64) throw new LedgerOpError('BAD_NAME');
    if (this.issuers.has(sender)) throw new LedgerOpError('WRONG_STATUS');
    this.issuers.set(sender, {
      name,
      status: 'PENDING',
      accreditedAt: null,
      approvals: new Set(),
      suspensions: new Set(),
    });
    this.issuerOrder.push(sender);
  }

  approve(sender: Address, issuerAccount: Address): void {
    this.requireMember(sender);
    const issuer = this.issuers.get(issuerAccount);
    if (issuer?.status !== 'PENDING') throw new LedgerOpError('WRONG_STATUS');
    if (issuer.approvals.has(sender)) throw new LedgerOpError('ALREADY_VOTED');
    issuer.approvals.add(sender);
    if (issuer.approvals.size >= this.quorum) {
      issuer.status = 'ACTIVE';
      issuer.accreditedAt = this.head().time;
    }
  }

  suspend(sender: Address, issuerAccount: Address): void {
    this.requireMember(sender);
    const issuer = this.issuers.get(issuerAccount);
    if (issuer?.status !== 'ACTIVE') throw new LedgerOpError('WRONG_STATUS');
    if (issuer.suspensions.has(sender)) throw new LedgerOpError('ALREADY_VOTED');
    issuer.suspensions.add(sender);
    if (issuer.suspensions.size >= this.quorum) issuer.status = 'SUSPENDED';
  }

  anchor(sender: Address, credentialHash: Hex, keyId: Hex): void {
    if (this.issuers.get(sender)?.status !== 'ACTIVE') throw new LedgerOpError('WRONG_STATUS');
    const key = this.accounts.get(sender)?.find((owner) => owner.keyId === keyId);
    if (!key || key.removedAt !== null) throw new LedgerOpError('KEY_NOT_LIVE');
    const id = recordKey(sender, credentialHash);
    if (this.records.has(id)) throw new LedgerOpError('ALREADY_EXISTS');
    const { number, time } = this.head();
    const record: RecordInfo = {
      credentialHash,
      issuer: sender,
      keyId,
      anchoredAt: time,
      revokedAt: null,
      blockNumber: number,
    };
    this.records.set(id, record);
    this.anchorLog.push(record);
  }

  revoke(sender: Address, credentialHash: Hex): void {
    const record = this.records.get(recordKey(sender, credentialHash));
    if (!record) throw new LedgerOpError('NOT_FOUND');
    if (record.revokedAt !== null) throw new LedgerOpError('ALREADY_REVOKED');
    record.revokedAt = this.head().time;
  }

  addKey(sender: Address, jwk: P256Jwk): void {
    const keys = this.accounts.get(sender) ?? [];
    if (keys.some((owner) => owner.keyId === keyIdOf(jwk))) throw new LedgerOpError('OWNER_EXISTS');
    keys.push(this.newKey(jwk));
  }

  removeKey(sender: Address, keyId: Hex): void {
    const keys = this.accounts.get(sender) ?? [];
    const key = keys.find((owner) => owner.keyId === keyId);
    if (!key || key.removedAt !== null) throw new LedgerOpError('OWNER_UNKNOWN');
    if (keys.filter((owner) => owner.removedAt === null).length === 1) {
      throw new LedgerOpError('LAST_OWNER');
    }
    key.removedAt = this.head().time;
  }

  // --- signed operations: what the memory account client posts ---

  /** Verifies the op against the account's live keys (deploying it on first use), then runs it. */
  async execute(op: SignedOp): Promise<TxReceipt> {
    const account = lower(op.account);
    if (this.usedNonces.has(op.nonce)) throw new LedgerOpError('REPLAY');
    if (!this.accounts.has(account)) this.deployExpected(account, op);
    const key = this.accounts.get(account)?.find((owner) => owner.keyId === op.keyId);
    if (!key || key.removedAt !== null) throw new LedgerOpError('NOT_AUTHORIZED');
    const signed = opMessage(account, op.nonce, op.payload);
    if (!(await verifyEs256(key.jwk, signed, fromB64u(op.signature)))) {
      throw new LedgerOpError('NOT_AUTHORIZED');
    }
    this.rememberNonce(op.nonce);
    this.dispatch(account, memoryCallSchema.parse(JSON.parse(op.payload)));
    return this.mine();
  }

  // --- reads ---

  issuerInfo(account: Address): IssuerInfo {
    const issuer = this.issuers.get(account);
    return {
      account,
      name: issuer?.name ?? '',
      status: issuer?.status ?? 'NONE',
      approvals: issuer?.approvals.size ?? 0,
      quorum: this.quorum,
      accreditedAt: issuer?.accreditedAt ?? null,
    };
  }

  keys(account: Address): KeyInfo[] {
    return (this.accounts.get(account) ?? []).map((key) => ({ ...key }));
  }

  record(issuer: Address, credentialHash: Hex): RecordInfo | null {
    const record = this.records.get(recordKey(issuer, credentialHash));
    return record ? { ...record } : null;
  }

  state(): NetworkState {
    const head = this.head();
    const first = Math.max(FIRST_BLOCK, head.number - RECENT_BLOCKS + 1);
    return {
      chainId: CHAIN_ID,
      head,
      blockTimeSec: BLOCK_TIME_SEC,
      quorum: this.quorum,
      members: this.members.map((member) => ({ ...member })),
      issuers: this.issuerOrder.map((account) => this.issuerInfo(account)),
      blocks: Array.from({ length: head.number - first + 1 }, (_, index) => {
        const number = first + index;
        return {
          number,
          time: head.time - (head.number - number) * BLOCK_TIME_SEC,
          txCount: this.txPerBlock.get(number) ?? 0,
        };
      }),
      anchors: this.anchorLog
        .slice(-RECENT_ANCHORS)
        .reverse()
        .map(({ credentialHash, issuer, blockNumber, anchoredAt }) => ({
          credentialHash,
          issuer,
          blockNumber,
          time: anchoredAt,
        })),
    };
  }

  reader(): LedgerReader {
    return {
      head: async () => this.head(),
      issuer: async (account) => this.issuerInfo(lower(account)),
      key: async (account, keyId) =>
        this.keys(lower(account)).find((key) => key.keyId === keyId) ?? null,
      keys: async (account) => this.keys(lower(account)),
      record: async (issuer, hash) => this.record(lower(issuer), hash),
      state: async () => this.state(),
      accountAddress: async (jwk, salt) => memoryAccountAddress(jwk, salt),
      isDeployed: async (account) => this.accounts.has(lower(account)),
    };
  }

  private newKey(jwk: P256Jwk): KeyInfo {
    const publicJwk: P256Jwk = { kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y };
    return {
      keyId: keyIdOf(publicJwk),
      jwk: publicJwk,
      addedAt: this.head().time,
      removedAt: null,
    };
  }

  private requireMember(sender: Address): void {
    if (!this.members.some((member) => member.account === sender)) {
      throw new LedgerOpError('NOT_MEMBER');
    }
  }

  private deployExpected(account: Address, op: SignedOp): void {
    const salt = BigInt(op.salt);
    if (memoryAccountAddress(op.jwk, salt) !== account || keyIdOf(op.jwk) !== op.keyId) {
      throw new LedgerOpError('NOT_AUTHORIZED');
    }
    this.deployAccount(op.jwk, salt);
  }

  private dispatch(sender: Address, call: MemoryCall): void {
    switch (call.method) {
      case 'applyForAccreditation':
        return this.applyForAccreditation(sender, call.name);
      case 'anchor':
        return this.anchor(sender, call.credentialHash as Hex, call.keyId as Hex);
      case 'revoke':
        return this.revoke(sender, call.credentialHash as Hex);
      case 'approve':
        return this.approve(sender, call.issuer as Address);
      case 'suspend':
        return this.suspend(sender, call.issuer as Address);
      case 'addKey':
        return this.addKey(sender, call.jwk);
      case 'removeKey':
        return this.removeKey(sender, call.keyId as Hex);
    }
  }

  private mine(): TxReceipt {
    const { number } = this.head();
    const index = this.txPerBlock.get(number) ?? 0;
    this.txPerBlock.set(number, index + 1);
    const prefix = `${number.toString(16).padStart(8, '0')}${index.toString(16).padStart(8, '0')}`;
    return { txHash: `0x${prefix.padEnd(64, '0')}`, blockNumber: number };
  }

  private rememberNonce(nonce: string): void {
    this.usedNonces.add(nonce);
    if (this.usedNonces.size > MAX_REMEMBERED_NONCES) {
      this.usedNonces.delete(this.usedNonces.values().next().value as string);
    }
  }
}

interface MemoryWorld {
  ledger: MemoryLedger;
  identities: { members: DemoIdentity[]; employers: DemoIdentity[] };
}

const globalWorld = globalThis as { __constanciaMemoryLedger?: Promise<MemoryWorld> };

/** One ledger per server process (survives Next dev reloads). Throws in production. */
export function getMemoryWorld(): Promise<MemoryWorld> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'The memory ledger is dev and test scaffolding and refuses to run in production',
    );
  }
  globalWorld.__constanciaMemoryLedger ??= (async () => {
    const ledger = new MemoryLedger();
    return { ledger, identities: await ledger.seed() };
  })();
  return globalWorld.__constanciaMemoryLedger;
}
