import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ExecutionUnits } from 'src/correlation/execution-units';
import { FileTail } from './file-tail';
import type { KernelEvent } from './kernel-event';
import { parseCollectorLine } from './parse-collector-line';

export interface CapturedEvent {
  seq: number;
  session: string;
  event: KernelEvent;
}

const POLL_INTERVAL_MS = 200;

/** Ingests the NDJSON written by scripts/collect.sh and feeds the correlation. */
@Injectable()
export class CaptureService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CaptureService.name);
  private readonly path = process.env.CAPTURE_FILE ?? '/var/tmp/trust-agent/capture.jsonl';
  private readonly session = process.env.CAPTURE_SESSION ?? 'claude-demo';
  private readonly tail = new FileTail(this.path, (line) => {
    this.ingest(line);
  });
  private readonly captured: CapturedEvent[] = [];
  readonly units = new ExecutionUnits();
  private lostEvents = 0;
  private malformedLines = 0;

  onModuleInit(): void {
    this.logger.log(`siguiendo ${this.path} (sesión ${this.session})`);
    this.tail.start(POLL_INTERVAL_MS, (error) => {
      this.logger.error(`no se pudo leer ${this.path}: ${String(error)}`);
    });
  }

  onModuleDestroy(): void {
    this.tail.stop();
  }

  events(): readonly CapturedEvent[] {
    return this.captured;
  }

  stats(): { events: number; lostEvents: number; malformedLines: number } {
    return {
      events: this.captured.length,
      lostEvents: this.lostEvents,
      malformedLines: this.malformedLines,
    };
  }

  private ingest(line: string): void {
    if (line.trim() === '') {
      return;
    }
    let parsed: ReturnType<typeof parseCollectorLine>;
    try {
      parsed = parseCollectorLine(line);
    } catch (error) {
      this.malformedLines++;
      this.logger.warn(`línea inválida: ${String(error)}`);
      return;
    }
    if (parsed === null) {
      return;
    }
    if (parsed.kind === 'LOST') {
      // The kernel saw these events but bpftrace dropped them: the evidence has a gap.
      this.lostEvents += parsed.count;
      this.logger.error(`bpftrace perdió ${parsed.count} eventos`);
      return;
    }
    this.captured.push({ seq: this.captured.length + 1, session: this.session, event: parsed });
    this.units.apply(parsed);
  }
}
