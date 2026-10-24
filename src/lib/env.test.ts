import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const VALID = {
  NEXT_PUBLIC_APP_URL: 'https://scholarkey.example',
  NEXT_PUBLIC_PRIVY_APP_ID: 'privy-app-id',
  PRIVY_APP_SECRET: 'privy-secret',
  DATABASE_URL: 'postgresql://user:pass@host/db',
  BASE_SEPOLIA_RPC_URL: 'https://sepolia.base.org',
  NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL: 'https://sepolia.base.org',
  SPONSOR_PRIVATE_KEY: `0x${'a'.repeat(64)}`,
  NEXT_PUBLIC_ANCHOR_CONTRACT_ADDRESS: `0x${'b'.repeat(40)}`,
  ANCHOR_DEPLOY_BLOCK: '12345',
};

type Vars = Partial<Record<keyof typeof VALID, string>>;

function setEnv(vars: Vars): void {
  for (const key of Object.keys(VALID) as (keyof typeof VALID)[]) {
    const value = vars[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.resetModules();
  setEnv(VALID);
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('env', () => {
  it('does not parse at import', async () => {
    setEnv({});
    await expect(import('./env')).resolves.toBeDefined();
  });

  it('serverEnv returns the typed server vars when all are set', async () => {
    const { serverEnv } = await import('./env');
    expect(serverEnv()).toEqual({
      PRIVY_APP_SECRET: 'privy-secret',
      DATABASE_URL: 'postgresql://user:pass@host/db',
      BASE_SEPOLIA_RPC_URL: 'https://sepolia.base.org',
      SPONSOR_PRIVATE_KEY: `0x${'a'.repeat(64)}`,
      ANCHOR_DEPLOY_BLOCK: 12345,
    });
  });

  it('serverEnv names a missing var and never prints values', async () => {
    setEnv({ ...VALID, PRIVY_APP_SECRET: undefined });
    const { serverEnv } = await import('./env');
    expect(() => serverEnv()).toThrow('PRIVY_APP_SECRET');
  });

  it('serverEnv names an invalid var without echoing its value', async () => {
    setEnv({ ...VALID, DATABASE_URL: 'not-a-url-secret-value' });
    const { serverEnv } = await import('./env');
    let message = '';
    try {
      serverEnv();
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain('DATABASE_URL');
    expect(message).not.toContain('not-a-url-secret-value');
  });

  it('serverEnv rejects an empty ANCHOR_DEPLOY_BLOCK', async () => {
    setEnv({ ...VALID, ANCHOR_DEPLOY_BLOCK: '' });
    const { serverEnv } = await import('./env');
    expect(() => serverEnv()).toThrow('ANCHOR_DEPLOY_BLOCK');
  });

  it('clientEnv returns the typed client vars and names a bad one', async () => {
    const { clientEnv } = await import('./env');
    expect(clientEnv().NEXT_PUBLIC_PRIVY_APP_ID).toBe('privy-app-id');

    vi.resetModules();
    setEnv({ ...VALID, NEXT_PUBLIC_ANCHOR_CONTRACT_ADDRESS: '0x123' });
    const fresh = await import('./env');
    expect(() => fresh.clientEnv()).toThrow('NEXT_PUBLIC_ANCHOR_CONTRACT_ADDRESS');
  });
});
