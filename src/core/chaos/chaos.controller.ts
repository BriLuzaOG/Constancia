import { Controller, Param, Post } from '@nestjs/common';
import { AlertsService } from '../alerts/alerts.service';
import { EvidenceStore } from '../evidence/evidence.store';

/**
 * Consola del Caos: los mismos ataques que haría un agente comprometido.
 * En producción esto no existe; en el demo se dispara desde la CLI.
 */
@Controller('api/chaos')
export class ChaosController {
  constructor(
    private readonly store: EvidenceStore,
    private readonly alerts: AlertsService,
  ) {}

  @Post(':sessionId/tamper/:seq')
  async tamper(
    @Param('sessionId') sessionId: string,
    @Param('seq') seq: string,
  ): Promise<{ ok: boolean }> {
    const ok = this.store.tamper(sessionId, Number(seq), { forged: true });

    if (ok) {
      await this.alerts.send(`Evidencia alterada en ${sessionId}, seq ${seq}`);
    }

    return { ok };
  }

  @Post(':sessionId/delete/:seq')
  async remove(
    @Param('sessionId') sessionId: string,
    @Param('seq') seq: string,
  ): Promise<{ ok: boolean }> {
    const ok = this.store.remove(sessionId, Number(seq));

    if (ok) {
      await this.alerts.send(`Evidencia borrada en ${sessionId}, seq ${seq}`);
    }

    return { ok };
  }

  @Post(':sessionId/kill')
  async kill(@Param('sessionId') sessionId: string): Promise<{ ok: boolean }> {
    const ok = this.store.kill(sessionId);
    await this.alerts.send(`Kill switch activado en ${sessionId}`);
    return { ok };
  }
}
