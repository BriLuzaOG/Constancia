import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Alertas por Telegram. Sin token configurado, la alerta queda en el log:
 * el demo nunca se rompe por una credencial ausente.
 */
@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(private readonly config: ConfigService) {}

  async send(text: string): Promise<void> {
    const token = this.config.get<string>('TELEGRAM_TOKEN');
    const chatId = this.config.get<string>('TELEGRAM_CHAT_ID');

    if (!token || !chatId) {
      this.logger.warn(`[alerta] ${text}`);
      return;
    }

    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
    } catch (cause) {
      this.logger.error(`No se pudo enviar la alerta: ${String(cause)}`);
    }
  }
}
