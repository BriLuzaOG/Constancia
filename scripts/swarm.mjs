/**
 * Enjambre de demo: tres agentes emiten tool calls y uno de ellos se
 * compromete, altera y borra evidencia. Todo pasa por la API real.
 *
 * Uso:
 *   node scripts/swarm.mjs
 *   API_URL=http://localhost:3000 SESSION=demo node scripts/swarm.mjs
 */
const BASE = process.env.API_URL ?? 'http://localhost:3000';
const SESSION = process.env.SESSION ?? 'demo';

async function post(path, body) {
  const response = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`${path} -> HTTP ${response.status}`);
  }

  return response.json();
}

async function reset() {
  await fetch(`${BASE}/api/sessions/${SESSION}`, { method: 'DELETE' });
}

const AGENTS = ['agent-01', 'agent-02', 'agent-rogue'];
const TOOLS = [
  { tool: 'shell.exec', cmd: 'ls -la' },
  { tool: 'http.get', url: 'api.github.com' },
  { tool: 'rag.search', query: 'incident' },
  { tool: 'db.query', sql: 'select * from users' },
];

async function emit(index) {
  const agent = AGENTS[index % AGENTS.length];
  const payload = TOOLS[index % TOOLS.length];

  await post('/api/events', {
    sessionId: SESSION,
    type: 'tool_call',
    payload: { agent, ...payload },
  });

  console.log(`[swarm] ${agent} -> ${payload.tool}`);
}

await reset();
console.log(`[swarm] sesión ${SESSION} reiniciada`);

for (let index = 0; index < 9; index += 1) {
  await emit(index);
  await new Promise((resolve) => setTimeout(resolve, 500));
}

console.log('[rogue] alterando seq 4');
await post(`/api/chaos/${SESSION}/tamper/4`);

console.log('[rogue] borrando seq 7');
await post(`/api/chaos/${SESSION}/delete/7`);

const anchor = await post(`/api/anchor/${SESSION}`).catch(() => null);
if (anchor) {
  console.log(`[anchor] ${anchor.mode} root=${anchor.root.slice(0, 20)}...`);
}

console.log('[beto] activando kill switch');
await post(`/api/chaos/${SESSION}/kill`);

const blocked = await fetch(`${BASE}/api/events`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    sessionId: SESSION,
    type: 'tool_call',
    payload: { tool: 'shell.exec', cmd: 'rm -rf /' },
  }),
});

console.log(`[beto] escritura del rogue bloqueada: HTTP ${blocked.status}`);
console.log('[demo] listo. Evidencia manipulada, anclada y agente contenido.');
