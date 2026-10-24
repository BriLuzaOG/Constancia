import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import { EvidenceStore } from '../evidence/evidence.store';
import { AnchorService } from './anchor.service';

describe('AnchorService', () => {
  let dir: string;
  let store: EvidenceStore;
  let service: AnchorService;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'trust-anchor-'));
    process.env.DATA_DIR = dir;
    store = new EvidenceStore();
    const config = { get: () => undefined } as unknown as ConfigService;
    service = new AnchorService(config, store);
  });

  afterEach(() => {
    delete process.env.DATA_DIR;
    rmSync(dir, { recursive: true, force: true });
  });

  it('cae a dry-run con placeholders', async () => {
    const values: Record<string, string> = {
      RPC_URL: 'http://localhost:8545',
      PRIVATE_KEY: '0x',
      CONTRACT_ADDRESS: '0x',
    };
    const config = {
      get: (key: string) => values[key],
    } as unknown as ConfigService;
    const placeholder = new AnchorService(config, store);
    store.append('s1', 'tool_call', { tool: 'a' });

    const result = await placeholder.anchorSession('s1');

    expect(result.mode).toBe('dry-run');
  });

  it('calcula la raíz y hace dry-run sin credenciales', async () => {
    store.append('s1', 'tool_call', { tool: 'a' });
    store.append('s1', 'tool_call', { tool: 'b' });

    const result = await service.anchorSession('s1');

    expect(result.mode).toBe('dry-run');
    expect(result.root).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(result.txHash).toBeNull();
  });
});
