import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EvidenceStore } from '../evidence/evidence.store';
import { AnchorService } from './anchor.service';

/**
 * Ancla todas las sesiones a intervalo fijo. Es el pre-compromiso: el
 * pasado queda clavado y no se puede fabricar historia retroactiva.
 */
@Injectable()
export class AnchorJob implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AnchorJob.name);
  private timer: NodeJS.Timeout | undefined;

  constructor(
    private readonly anchor: AnchorService,
    private readonly store: EvidenceStore,
    private readonly config: ConfigService,
  ) {}

  onModuleInit(): void {
    const interval = Number(this.config.get<string>('ANCHOR_INTERVAL_MS') ?? 30_000);
    this.timer = setInterval(() => {
      void this.run();
    }, interval);
    this.logger.log(`anclaje cada ${interval} ms`);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private async run(): Promise<void> {
    await Promise.all(
      this.store.sessionIds().map((sessionId) => this.anchor.anchorSession(sessionId)),
    );
  }
}
