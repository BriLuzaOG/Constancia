import { createHash } from 'node:crypto';

export type EvidenceEvent = {
  seq: number;
  sessionId: string;
  type: string;
  payload: unknown;
  ts: string;
  prevHash: string;
  hash: string;
};

export type SessionHead = {
  sessionId: string;
  seq: number;
  hash: string;
};

export type ChainVerification = {
  ok: boolean;
  brokenAt: number | null;
  missing: number[];
  reason: 'intact' | 'tampered' | 'deleted' | 'tampered_and_deleted';
};

const GENESIS = 'sha256:genesis';

export function hashEvent(event: Omit<EvidenceEvent, 'hash'>): string {
  const canonical = JSON.stringify({
    seq: event.seq,
    sessionId: event.sessionId,
    type: event.type,
    payload: event.payload,
    ts: event.ts,
    prevHash: event.prevHash,
  });

  return `sha256:${createHash('sha256').update(canonical).digest('hex')}`;
}

export function seal(
  sessionId: string,
  type: string,
  payload: unknown,
  previous?: EvidenceEvent,
): EvidenceEvent {
  const base = {
    seq: (previous?.seq ?? 0) + 1,
    sessionId,
    type,
    payload,
    ts: new Date().toISOString(),
    prevHash: previous?.hash ?? GENESIS,
  };

  return { ...base, hash: hashEvent(base) };
}

/**
 * Recomputa la cadena y reporta dos ataques distintos:
 * - alteración: el hash recalculado no coincide con el guardado
 * - borrado: falta un `seq` en la secuencia
 *
 * Un borrado del ÚLTIMO evento no deja hueco. Ese caso solo se detecta
 * contra la cabeza anclada, que es el siguiente paso.
 */
export function verifyChain(events: EvidenceEvent[], head?: SessionHead): ChainVerification {
  const sorted = events.toSorted((a, b) => a.seq - b.seq);
  const missing: number[] = [];
  let brokenAt: number | null = null;
  let previous: EvidenceEvent | undefined;

  for (const event of sorted) {
    const expectedSeq = (previous?.seq ?? 0) + 1;

    if (event.seq !== expectedSeq) {
      for (let seq = expectedSeq; seq < event.seq; seq += 1) {
        missing.push(seq);
      }
    }

    const { hash, ...base } = event;
    const recomputed = hashEvent(base);
    const chainBroken = previous !== undefined && event.prevHash !== previous.hash;

    if ((recomputed !== hash || chainBroken) && brokenAt === null) {
      // No se corta el recorrido: un borrado posterior sigue siendo
      // detectable aunque antes haya un hash roto.
      brokenAt = event.seq;
    }

    previous = event;
  }

  // La cabeza vive fuera del store. Si el rogue borra el ÚLTIMO evento,
  // no hay hueco en la secuencia: el hueco está entre el último evento
  // presente y la cabeza.
  const lastSeq = previous?.seq ?? 0;

  if (head !== undefined && head.seq > lastSeq) {
    for (let seq = lastSeq + 1; seq <= head.seq; seq += 1) {
      missing.push(seq);
    }
  }

  if (head !== undefined) {
    const headEvent = sorted.find((event) => event.seq === head.seq);
    if (headEvent !== undefined && headEvent.hash !== head.hash && brokenAt === null) {
      brokenAt = head.seq;
    }
  }

  const tampered = brokenAt !== null;
  const deleted = missing.length > 0;

  return {
    ok: !tampered && !deleted,
    brokenAt,
    missing,
    reason:
      tampered && deleted
        ? 'tampered_and_deleted'
        : tampered
          ? 'tampered'
          : deleted
            ? 'deleted'
            : 'intact',
  };
}
