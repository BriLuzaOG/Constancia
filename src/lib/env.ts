import { z } from 'zod';

// No `server-only` import: it would break clientEnv() in client components. The server
// getter is guarded at runtime instead. Next only inlines NEXT_PUBLIC_* values, so a
// browser caller would see the server vars as missing and fail validation, never leak them.

const SERVER_SCHEMA = z.object({
  PRIVY_APP_SECRET: z.string().min(1),
  DATABASE_URL: z.url(),
  BASE_SEPOLIA_RPC_URL: z.url(),
  SPONSOR_PRIVATE_KEY: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  // Digits only: z.coerce.number() would turn an empty value into 0.
  ANCHOR_DEPLOY_BLOCK: z.string().regex(/^\d+$/).transform(Number),
});

const CLIENT_SCHEMA = z.object({
  NEXT_PUBLIC_APP_URL: z.url(),
  NEXT_PUBLIC_PRIVY_APP_ID: z.string().min(1),
  NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL: z.url(),
  NEXT_PUBLIC_ANCHOR_CONTRACT_ADDRESS: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
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
    NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
    NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL,
    NEXT_PUBLIC_ANCHOR_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_ANCHOR_CONTRACT_ADDRESS,
  });
  return client;
}
