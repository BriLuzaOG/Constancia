import 'server-only';

export function rateLimit(
  _req: Request,
  _key: string,
  _opts: { limit: number; windowMs: number },
): void {
  throw new Error('not implemented: A4-S1');
}
