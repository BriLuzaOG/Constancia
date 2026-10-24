import { createHash } from 'node:crypto';

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Raíz Merkle de los hashes de una sesión. Si el nivel tiene un número
 * impar de nodos, el último se duplica: el resultado es determinista y
 * cualquier cambio en una hoja cambia la raíz.
 */
export function merkleRoot(hashes: string[]): string {
  if (hashes.length === 0) {
    return `sha256:${sha256('')}`;
  }

  let level = hashes.map((hash) => hash.replace(/^sha256:/, ''));

  while (level.length > 1) {
    const next: string[] = [];

    for (let index = 0; index < level.length; index += 2) {
      const left = level[index]!;
      const right = level[index + 1] ?? left;
      next.push(sha256(`${left}${right}`));
    }

    level = next;
  }

  return `sha256:${level[0]}`;
}
