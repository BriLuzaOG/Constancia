import { useEffect, useState } from "react";

type EvidenceEvent = {
  seq: number;
  sessionId: string;
  type: string;
  payload: unknown;
  ts: string;
  prevHash: string;
  hash: string;
};

type Verification = {
  ok: boolean;
  brokenAt: number | null;
  missing: number[];
  reason: "intact" | "tampered" | "deleted" | "tampered_and_deleted";
};

const SESSION = "demo";

const SEED = [
  { tool: "shell.exec", cmd: "ls -la" },
  { tool: "http.get", url: "api.github.com" },
  { tool: "db.query", sql: "select * from users" },
  { tool: "shell.exec", cmd: "whoami" },
  { tool: "decision", thought: "continuar con el plan" },
];

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

function appendEvent(payload: unknown): Promise<unknown> {
  return api("/api/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sessionId: SESSION, type: "tool_call", payload }),
  });
}

export default function App() {
  const [events, setEvents] = useState<EvidenceEvent[]>([]);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh(): Promise<void> {
    const [list, check] = await Promise.all([
      api<EvidenceEvent[]>(`/api/sessions/${SESSION}/events`),
      api<Verification>(`/api/sessions/${SESSION}/verify`),
    ]);
    setEvents(list);
    setVerification(check);
  }

  async function reload(): Promise<void> {
    try {
      await refresh();
      setError(null);
    } catch (cause) {
      setError(String(cause));
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  // SSE: cada cambio en la evidencia refresca el dashboard sin polling.
  useEffect(() => {
    const source = new EventSource('/events');

    source.onmessage = () => {
      void reload();
    };

    return () => {
      source.close();
    };
  }, []);

  async function run(action: () => Promise<void>): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await action();
      await refresh();
    } catch (cause) {
      setError(String(cause));
    } finally {
      setBusy(false);
    }
  }

  function seed(): Promise<void> {
    return run(async () => {
      await Promise.all(SEED.map((payload) => appendEvent(payload)));
    });
  }

  function attack(path: string): Promise<void> {
    return run(async () => {
      await api(path, { method: "POST" });
    });
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Trust</h1>
            <p className="text-sm text-slate-400">Caja negra auditable para agentes de IA</p>
          </div>
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">
            sesión {SESSION}
          </span>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-xl border border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Evidencia
            </h2>
            <span className="text-xs text-slate-500">{events.length} eventos</span>
          </div>

          <div className="divide-y divide-slate-800">
            {events.length === 0 && (
              <p className="px-5 py-8 text-sm text-slate-500">
                No hay eventos. Usa “Sembrar enjambre”.
              </p>
            )}

            {events.map((event) => (
              <div key={event.seq} className="px-5 py-3">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-mono text-xs text-slate-500">
                    #{String(event.seq).padStart(3, "0")} · {event.type}
                  </span>
                  <span className="font-mono text-xs text-slate-600">
                    {new Date(event.ts).toLocaleTimeString()}
                  </span>
                </div>
                <p className="mt-1 truncate font-mono text-sm text-slate-300">
                  {JSON.stringify(event.payload)}
                </p>
                <p className="mt-1 truncate font-mono text-[11px] text-slate-600">{event.hash}</p>
              </div>
            ))}
          </div>
        </section>

        <aside className="flex flex-col gap-4">
          <div
            className={
              verification?.ok
                ? "rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-5"
                : "rounded-xl border border-rose-500/40 bg-rose-500/10 p-5"
            }
          >
            <h2 className="text-sm font-semibold uppercase tracking-wide opacity-70">
              Verificación
            </h2>

            {verification === null ? (
              <p className="mt-2 text-sm opacity-70">Sin datos todavía.</p>
            ) : (
              <>
                <p className="mt-2 text-lg font-semibold">
                  {verification.ok ? "Cadena intacta" : "Evidencia manipulada"}
                </p>
                <p className="mt-1 text-sm opacity-80">{verification.reason}</p>
                {verification.brokenAt !== null && (
                  <p className="mt-2 text-sm">
                    Hash roto en seq <strong>{verification.brokenAt}</strong>
                  </p>
                )}
                {verification.missing.length > 0 && (
                  <p className="mt-1 text-sm">
                    Huecos de secuencia: <strong>{verification.missing.join(", ")}</strong>
                  </p>
                )}
              </>
            )}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Consola del Caos
            </h2>

            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => void seed()}
                disabled={busy}
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium hover:bg-slate-700 disabled:opacity-50"
              >
                Sembrar enjambre
              </button>

              <button
                type="button"
                onClick={() => void attack(`/api/chaos/${SESSION}/tamper/3`)}
                disabled={busy || events.length < 3}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 disabled:opacity-50"
              >
                Alterar seq 3
              </button>

              <button
                type="button"
                onClick={() => void attack(`/api/chaos/${SESSION}/delete/2`)}
                disabled={busy || events.length < 2}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 disabled:opacity-50"
              >
                Borrar seq 2
              </button>

              <button
                type="button"
                onClick={() =>
                  void run(async () => {
                    await refresh();
                  })
                }
                disabled={busy}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
              >
                Verificar
              </button>
            </div>

            {error !== null && <p className="mt-3 text-xs text-rose-300">{error}</p>}

            {events.length === 0 && (
              <p className="mt-3 text-xs text-slate-500">
                Primero siembra eventos para habilitar los ataques.
              </p>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
