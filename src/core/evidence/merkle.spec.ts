import { describe, expect, it } from 'vitest';
import { merkleRoot } from './merkle';

function leaf(char: string): string {
  return `sha256:${char.repeat(64)}`;
}

describe('merkleRoot', () => {
  it('es determinista', () => {
    const hashes = [leaf('a'), leaf('b'), leaf('c')];

    expect(merkleRoot(hashes)).toBe(merkleRoot([...hashes]));
  });

  it('cambia si cambia una hoja', () => {
    const base = merkleRoot([leaf('a'), leaf('b')]);
    const altered = merkleRoot([leaf('a'), leaf('c')]);

    expect(base).not.toBe(altered);
  });

  it('la raíz de una sola hoja es la hoja', () => {
    expect(merkleRoot([leaf('a')])).toBe(leaf('a'));
  });

  it('maneja un número impar de hojas', () => {
    const root = merkleRoot([leaf('a'), leaf('b'), leaf('c')]);

    expect(root).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it('un conjunto vacío tiene raíz propia', () => {
    expect(merkleRoot([])).toMatch(/^sha256:[a-f0-9]{64}$/);
  });
});
