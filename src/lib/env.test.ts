import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const VALID = {
  NEXT_PUBLIC_APP_URL: 'https://constancia.example',
  NEXT_PUBLIC_LEDGER_MODE: 'chain',
  NEXT_PUBLIC_LEDGER_CHAIN_ID: '24024',
  NEXT_PUBLIC_ENTRY_POINT_ADDRESS: `0x${'c'.repeat(40)}`,
  NEXT_PUBLIC_ACCOUNT_FACTORY_ADDRESS: `0x${'d'.repeat(40)}`,
  NEXT_PUBLIC_DEMO_MODE: '1',
  LEDGER_MODE: 'chain',
  LEDGER_RPC_URL: 'https://ledger.example',
  LEDGER_CONTRACT_ADDRESS: `0x${'b'.repeat(40)}`,
  LEDGER_DEPLOY_BLOCK: '12345',
  PAYMASTER_ADDRESS: `0x${'e'.repeat(40)}`,
  RELAYER_PRIVATE_KEY: `0x${'a'.repeat(64)}`,
  DATABASE_URL: 'postgresql://user:pass@host/db',
  SESSION_SECRET: 's'.repeat(32),
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
      LEDGER_MODE: 'chain',
      LEDGER_RPC_URL: 'https://ledger.example',
      LEDGER_CONTRACT_ADDRESS: `0x${'b'.repeat(40)}`,
      LEDGER_DEPLOY_BLOCK: 12345,
      PAYMASTER_ADDRESS: `0x${'e'.repeat(40)}`,
      RELAYER_PRIVATE_KEY: `0x${'a'.repeat(64)}`,
      DATABASE_URL: 'postgresql://user:pass@host/db',
      SESSION_SECRET: 's'.repeat(32),
    });
  });

  it('serverEnv names a missing var and never prints values', async () => {
    setEnv({ ...VALID, SESSION_SECRET: undefined });
    const { serverEnv } = await import('./env');
    expect(() => serverEnv()).toThrow('SESSION_SECRET');
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

  it('serverEnv rejects an empty LEDGER_DEPLOY_BLOCK', async () => {
    setEnv({ ...VALID, LEDGER_DEPLOY_BLOCK: '' });
    const { serverEnv } = await import('./env');
    expect(() => serverEnv()).toThrow('LEDGER_DEPLOY_BLOCK');
  });

  it('clientEnv returns the typed client vars and names a bad one', async () => {
    const { clientEnv } = await import('./env');
    expect(clientEnv()).toEqual({
      NEXT_PUBLIC_APP_URL: 'https://constancia.example',
      NEXT_PUBLIC_LEDGER_MODE: 'chain',
      NEXT_PUBLIC_LEDGER_CHAIN_ID: 24024,
      NEXT_PUBLIC_ENTRY_POINT_ADDRESS: `0x${'c'.repeat(40)}`,
      NEXT_PUBLIC_ACCOUNT_FACTORY_ADDRESS: `0x${'d'.repeat(40)}`,
      NEXT_PUBLIC_DEMO_MODE: '1',
    });

    vi.resetModules();
    setEnv({ ...VALID, NEXT_PUBLIC_ACCOUNT_FACTORY_ADDRESS: '0x123' });
    const fresh = await import('./env');
    expect(() => fresh.clientEnv()).toThrow('NEXT_PUBLIC_ACCOUNT_FACTORY_ADDRESS');
  });

  it('clientEnv defaults NEXT_PUBLIC_DEMO_MODE to 0', async () => {
    setEnv({ ...VALID, NEXT_PUBLIC_DEMO_MODE: undefined });
    const { clientEnv } = await import('./env');
    expect(clientEnv().NEXT_PUBLIC_DEMO_MODE).toBe('0');
  });
});
