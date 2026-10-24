import { Module } from '@nestjs/common';
import { AlertsModule } from '../alerts/alerts.module';
import { EvidenceModule } from '../evidence/evidence.module';
import { ChaosController } from './chaos.controller';

@Module({
  imports: [EvidenceModule, AlertsModule],
  controllers: [ChaosController],
})
export class ChaosModule {}
