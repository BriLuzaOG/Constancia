import 'server-only';
import type { DidDocument } from './types';

export class DidUnreachableError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'DidUnreachableError';
  }
}

export class DidNotFoundError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'DidNotFoundError';
  }
}

export class DidInvalidError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'DidInvalidError';
  }
}

export function resolveDidWeb(_did: string): Promise<{ document: DidDocument; url: string }> {
  throw new Error('not implemented: A5-S1');
}
