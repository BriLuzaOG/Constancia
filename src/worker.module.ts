import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

/**
 * Módulo raíz del worker. Los daemons (sealer, batcher, anchor, witness)
 * se registran aquí en cuanto existan.
 */
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
})
export class WorkerModule {}
