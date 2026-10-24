import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

/**
 * Proceso de daemons: mismo código e imagen que la API, pero SIN HTTP.
 * Aquí viven sealer, batcher, anchor y witnesses. La llave de firma nunca
 * queda en el proceso que atiende el dashboard.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(WorkerModule);

  // SIGTERM/SIGINT: los módulos cierran sus ciclos antes de salir.
  app.enableShutdownHooks();

  new Logger('Worker').log('worker iniciado');
}

void bootstrap();
