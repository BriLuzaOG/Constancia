import { z } from 'zod';

// No `server-only` import: it would break clientEnv() in client components. The server
// getter is guarded at runtime instead. Next only inlines NEXT_PUBLIC_* values, so a
// browser caller would see the server vars as missing and fail validation, never leak them.

type Hex = `0x${string}`;
// Lowercase, as contracts §3 requires, so equality comparisons hold.
const ADDRESS = z
  .string()
  .regex(/^0x[0-9a-fA-F]{40}$/)
  .transform((s) => s.toLowerCase() as Hex);
const LEDGER_MODE = z.enum(['memory', 'chain']);

const SERVER_SCHEMA = z.object({
  LEDGER_MODE,
  LEDGER_RPC_URL: z.url(),
  LEDGER_CONTRACT_ADDRESS: ADDRESS,
  // Digits only: z.coerce.number() would turn an empty value into 0.
  LEDGER_DEPLOY_BLOCK: z.string().regex(/^\d+$/).transform(Number),
  PAYMASTER_ADDRESS: ADDRESS,
  RELAYER_PRIVATE_KEY: z
    .string()
    .regex(/^0x[0-9a-fA-F]{64}$/)
    .transform((s) => s as Hex),
  DATABASE_URL: z.url(),
  SESSION_SECRET: z.string().min(32),
});

const CLIENT_SCHEMA = z.object({
  NEXT_PUBLIC_APP_URL: z.url(),
  NEXT_PUBLIC_LEDGER_MODE: LEDGER_MODE,
  NEXT_PUBLIC_LEDGER_CHAIN_ID: z.string().regex(/^\d+$/).transform(Number),
  NEXT_PUBLIC_ENTRY_POINT_ADDRESS: ADDRESS,
  NEXT_PUBLIC_ACCOUNT_FACTORY_ADDRESS: ADDRESS,
  NEXT_PUBLIC_DEMO_MODE: z.enum(['0', '1']).default('0'),
});

export type ServerEnv = z.output<typeof SERVER_SCHEMA>;
export type ClientEnv = z.output<typeof CLIENT_SCHEMA>;

// Lists variable names only, never values.
function parse<T extends z.ZodType>(schema: T, raw: Record<string, unknown>): z.output<T> {
  const result = schema.safeParse(raw);
  if (result.success) return result.data;
  const names = [
    ...new Set(result.error.issues.map((issue) => String(issue.path[0] ?? 'environment'))),
  ];
  throw new Error(`Invalid environment variables: ${names.join(', ')}`);
}

let server: ServerEnv | undefined;
let client: ClientEnv | undefined;

export function serverEnv(): ServerEnv {
  if (typeof window !== 'undefined') throw new Error('serverEnv() cannot run in the browser');
  server ??= parse(SERVER_SCHEMA, process.env);
  return server;
}

// Explicit literals so Next inlines each NEXT_PUBLIC_* value into the client bundle.
export function clientEnv(): ClientEnv {
  client ??= parse(CLIENT_SCHEMA, {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_LEDGER_MODE: process.env.NEXT_PUBLIC_LEDGER_MODE,
    NEXT_PUBLIC_LEDGER_CHAIN_ID: process.env.NEXT_PUBLIC_LEDGER_CHAIN_ID,
    NEXT_PUBLIC_ENTRY_POINT_ADDRESS: process.env.NEXT_PUBLIC_ENTRY_POINT_ADDRESS,
    NEXT_PUBLIC_ACCOUNT_FACTORY_ADDRESS: process.env.NEXT_PUBLIC_ACCOUNT_FACTORY_ADDRESS,
    NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE,
  });
  return client;
}
