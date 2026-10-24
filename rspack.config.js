import { dirname, join } from 'node:path';

/**
 * Dos bundles desde el mismo código:
 *   src/main.ts   -> dist/main.js    (API HTTP + SSE + estáticos)
 *   src/worker.ts -> dist/worker.js  (daemons sin HTTP)
 *
 * El worker no necesita un flag: Nest lo compila con los mismos defaults y
 * solo cambia el entry y el nombre de salida.
 */
export default [
  // API: el default de Nest (src/main.ts -> dist/main.js)
  () => ({}),

  // Worker: mismo tsconfig y plugins, entry src/worker.ts -> dist/worker.js
  (defaults) => ({
    entry: join(dirname(defaults.entry), 'worker.ts'),
    output: { ...defaults.output, filename: 'worker.js' },
  }),
];
