import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EvidenceController } from './evidence.controller';
import { EvidenceStore } from './evidence.store';

@Module({
  controllers: [EvidenceController, EventsController],
  providers: [EvidenceStore],
  exports: [EvidenceStore],
})
export class EvidenceModule {}
