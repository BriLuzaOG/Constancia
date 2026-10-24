import { Module } from '@nestjs/common';
import { EvidenceModule } from '../evidence/evidence.module';
import { AnchorController } from './anchor.controller';
import { AnchorJob } from './anchor.job';
import { AnchorService } from './anchor.service';

@Module({
  imports: [EvidenceModule],
  controllers: [AnchorController],
  providers: [AnchorService, AnchorJob],
  exports: [AnchorService],
})
export class AnchorModule {}
