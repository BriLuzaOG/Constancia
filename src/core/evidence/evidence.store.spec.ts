import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ForbiddenException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EvidenceStore } from './evidence.store';
import { verifyChain } from './hash-chain';

describe('EvidenceStore', () => {
  let dir: string;
  let store: EvidenceStore;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'trust-store-'));
    process.env.DATA_DIR = dir;
    store = new EvidenceStore();
  });

  afterEach(() => {
    delete process.env.DATA_DIR;
    rmSync(dir, { recursive: true, force: true });
  });

  it('sella en orden y actualiza la cabeza', () => {
    const first = store.append('s1', 'tool_call', { tool: 'a' });
    const second = store.append('s1', 'tool_call', { tool: 'b' });

    expect(first.seq).toBe(1);
    expect(second.seq).toBe(2);
    expect(second.prevHash).toBe(first.hash);
    expect(store.list('s1')).toHaveLength(2);
    expect(store.head('s1')).toEqual({
      sessionId: 's1',
      seq: 2,
      hash: second.hash,
    });
  });

  it('detecta alteración del payload', () => {
    store.append('s1', 'tool_call', { tool: 'a' });
    store.append('s1', 'tool_call', { tool: 'b' });
    store.tamper('s1', 1, { forged: true });

    const result = verifyChain(store.list('s1'), store.head('s1'));

    expect(result.ok).toBe(false);
    expect(result.brokenAt).toBe(1);
  });

  it('detecta el borrado del último evento contra la cabeza', () => {
    store.append('s1', 'tool_call', { tool: 'a' });
    store.append('s1', 'tool_call', { tool: 'b' });
    store.remove('s1', 2);

    const result = verifyChain(store.list('s1'), store.head('s1'));

    expect(result.ok).toBe(false);
    expect(result.missing).toEqual([2]);
    expect(result.reason).toBe('deleted');
  });

  it('bloquea escrituras después del kill switch', () => {
    store.append('s1', 'tool_call', { tool: 'a' });
    store.kill('s1');

    expect(() => store.append('s1', 'tool_call', { tool: 'b' })).toThrow(ForbiddenException);
    expect(store.isQuarantined('s1')).toBe(true);
  });
});
