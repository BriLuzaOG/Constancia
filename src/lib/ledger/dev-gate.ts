import 'server-only';

/** Dev routes exist only outside production and only on the memory ledger. */
export const devRoutesEnabled = () =>
  process.env.NODE_ENV !== 'production' && (process.env.LEDGER_MODE ?? 'memory') === 'memory';

export const notFound = () =>
  Response.json({ error: 'NOT_FOUND', message: 'Not found' }, { status: 404 });
