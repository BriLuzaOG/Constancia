import { describe, expect, it } from 'vitest';
import { seal, verifyChain, type EvidenceEvent } from './hash-chain';

function buildChain(length: number): EvidenceEvent[] {
  const events: EvidenceEvent[] = [];

  for (let index = 0; index < length; index += 1) {
    events.push(seal('ses-1', 'tool_call', { tool: 'shell.exec', n: index }, events.at(-1)));
  }

  return events;
}

describe('hash-chain', () => {
  it('acepta una cadena intacta', () => {
    const result = verifyChain(buildChain(5));

    expect(result.ok).toBe(true);
    expect(result.reason).toBe('intact');
    expect(result.brokenAt).toBeNull();
  });

  it('detecta payload alterado sin recalcular el hash', () => {
    const events = buildChain(5);
    events[2]!.payload = { forged: true };

    const result = verifyChain(events);

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('tampered');
    expect(result.brokenAt).toBe(3);
  });

  it('detecta el borrado de un evento intermedio por hueco de seq', () => {
    const events = buildChain(5);
    events.splice(2, 1);

    const result = verifyChain(events);

    expect(result.ok).toBe(false);
    expect(result.missing).toEqual([3]);
    expect(result.reason).toBe('tampered_and_deleted');
  });

  it('normaliza el orden por seq antes de verificar', () => {
    const events = buildChain(4);
    const reordered = [events[0]!, events[2]!, events[1]!, events[3]!];

    expect(verifyChain(reordered).ok).toBe(true);
  });

  it('reporta alteración y borrado en la misma pasada', () => {
    const events = buildChain(8);
    events[3]!.payload = { forged: true };
    events.splice(6, 1);

    const result = verifyChain(events);

    expect(result.ok).toBe(false);
    expect(result.brokenAt).toBe(4);
    expect(result.missing).toEqual([7]);
    expect(result.reason).toBe('tampered_and_deleted');
  });

  it('detecta el borrado del último evento contra la cabeza', () => {
    const events = buildChain(5);
    const head = { sessionId: 'ses-1', seq: 5, hash: events[4]!.hash };
    events.pop();

    const result = verifyChain(events, head);

    expect(result.ok).toBe(false);
    expect(result.missing).toEqual([5]);
    expect(result.reason).toBe('deleted');
  });

  it('dos payloads distintos producen hashes distintos', () => {
    const a = seal('ses-1', 'tool_call', { tool: 'a' });
    const b = seal('ses-1', 'tool_call', { tool: 'b' });

    expect(a.hash).not.toBe(b.hash);
  });
});
