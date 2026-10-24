import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';
import { type EvidenceEvent, type SessionHead, seal } from './hash-chain';

/**
 * Evidencia persistente en archivos, no en memoria.
 *
 * - `data/events/<session>.jsonl`: la cadena que el agente comprometido
 *   puede alterar o borrar.
 * - `data/heads/<session>.json`: la cabeza de la sesión, fuera del alcance
 *   del ataque. Sin esto, borrar el último evento no dejaría hueco.
 * - `data/quarantine/<session>.json`: el kill switch.
 *
 * La interfaz es la misma que usará Postgres en Stage 1.
 */
@Injectable()
export class EvidenceStore {
  private readonly sessions = new Map<string, EvidenceEvent[]>();
  private readonly heads = new Map<string, SessionHead>();
  private readonly quarantined = new Set<string>();
  private readonly changes = new Subject<void>();
  private readonly logger = new Logger(EvidenceStore.name);
  private readonly dataDir: string;

  readonly changes$ = this.changes.asObservable();

  constructor() {
    this.dataDir = process.env.DATA_DIR ?? join(process.cwd(), 'data');
    mkdirSync(join(this.dataDir, 'events'), { recursive: true });
    mkdirSync(join(this.dataDir, 'heads'), { recursive: true });
    mkdirSync(join(this.dataDir, 'quarantine'), { recursive: true });
    this.load();
  }

  append(sessionId: string, type: string, payload: unknown): EvidenceEvent {
    if (this.quarantined.has(sessionId)) {
      throw new ForbiddenException(`sesión ${sessionId} en cuarentena`);
    }

    const events = this.sessions.get(sessionId) ?? [];
    const event = seal(sessionId, type, payload, events.at(-1));
    events.push(event);
    this.sessions.set(sessionId, events);
    this.persistEvents(sessionId, events);

    this.heads.set(sessionId, {
      sessionId,
      seq: event.seq,
      hash: event.hash,
    });
    this.persistHead(sessionId);

    this.notify();
    return event;
  }

  list(sessionId: string): EvidenceEvent[] {
    return [...(this.sessions.get(sessionId) ?? [])];
  }

  sessionIds(): string[] {
    return [...this.sessions.keys()];
  }

  head(sessionId: string): SessionHead | undefined {
    return this.heads.get(sessionId);
  }

  isQuarantined(sessionId: string): boolean {
    return this.quarantined.has(sessionId);
  }

  /** Ataque del rogue: altera el payload sin recalcular el hash. */
  tamper(sessionId: string, seq: number, payload: unknown): boolean {
    const events = this.sessions.get(sessionId);
    const event = events?.find((item) => item.seq === seq);
    if (!events || !event) {
      return false;
    }

    event.payload = payload;
    this.persistEvents(sessionId, events);
    this.notify();
    return true;
  }

  /** Ataque del rogue: borra un evento y deja el hueco. */
  remove(sessionId: string, seq: number): boolean {
    const events = this.sessions.get(sessionId);
    if (!events) {
      return false;
    }

    const index = events.findIndex((item) => item.seq === seq);
    if (index === -1) {
      return false;
    }

    events.splice(index, 1);
    this.persistEvents(sessionId, events);
    this.notify();
    return true;
  }

  /** Kill switch: el agente ya no puede escribir en esta sesión. */
  kill(sessionId: string): boolean {
    this.quarantined.add(sessionId);
    const path = this.quarantinePath(sessionId);
    writeFileSync(path, JSON.stringify({ sessionId, at: new Date().toISOString() }));
    this.notify();
    this.logger.warn(`sesión ${sessionId} en cuarentena`);
    return true;
  }

  reset(sessionId: string): boolean {
    const safe = this.safeName(sessionId);
    const existed =
      this.sessions.delete(sessionId) ||
      this.heads.delete(sessionId) ||
      this.quarantined.delete(sessionId);

    for (const path of [
      join(this.dataDir, 'events', `${safe}.jsonl`),
      join(this.dataDir, 'heads', `${safe}.json`),
      join(this.dataDir, 'quarantine', `${safe}.json`),
    ]) {
      if (existsSync(path)) {
        rmSync(path);
      }
    }

    this.notify();
    return existed;
  }

  private load(): void {
    const eventsDir = join(this.dataDir, 'events');

    for (const file of readdirSync(eventsDir)) {
      if (!file.endsWith('.jsonl')) {
        continue;
      }

      const sessionId = file.slice(0, -'.jsonl'.length);
      const events = readFileSync(join(eventsDir, file), 'utf8')
        .split('\n')
        .filter((line) => line.trim() !== '')
        .map((line) => JSON.parse(line) as EvidenceEvent);

      this.sessions.set(sessionId, events);

      const headPath = this.headPath(sessionId);
      if (existsSync(headPath)) {
        this.heads.set(sessionId, JSON.parse(readFileSync(headPath, 'utf8')) as SessionHead);
      }

      if (existsSync(this.quarantinePath(sessionId))) {
        this.quarantined.add(sessionId);
      }
    }
  }

  private persistEvents(sessionId: string, events: EvidenceEvent[]): void {
    const body = events.map((event) => JSON.stringify(event)).join('\n');
    writeFileSync(join(this.dataDir, 'events', `${this.safeName(sessionId)}.jsonl`), `${body}\n`);
  }

  private persistHead(sessionId: string): void {
    const head = this.heads.get(sessionId);
    if (!head) {
      return;
    }

    writeFileSync(this.headPath(sessionId), JSON.stringify(head));
  }

  private headPath(sessionId: string): string {
    return join(this.dataDir, 'heads', `${this.safeName(sessionId)}.json`);
  }

  private quarantinePath(sessionId: string): string {
    return join(this.dataDir, 'quarantine', `${this.safeName(sessionId)}.json`);
  }

  private safeName(sessionId: string): string {
    return sessionId.replaceAll(/[^a-zA-Z0-9_-]/g, '_');
  }

  private notify(): void {
    this.changes.next();
  }
}
