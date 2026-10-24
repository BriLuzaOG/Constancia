import { expect, test } from 'vitest';
import { HttpError } from './server';

// Guards the vitest `server-only` alias: importing a server-only module must not throw.
test('HttpError carries status and code', () => {
  const e = new HttpError(401, 'UNAUTHORIZED', 'no token');
  expect([e.status, e.code, e.message]).toEqual([401, 'UNAUTHORIZED', 'no token']);
});
