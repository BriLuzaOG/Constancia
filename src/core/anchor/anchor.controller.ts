import { Controller, Param, Post } from '@nestjs/common';
import { type AnchorResult, AnchorService } from './anchor.service';

@Controller('api/anchor')
export class AnchorController {
  constructor(private readonly anchor: AnchorService) {}

  @Post(':sessionId')
  anchorSession(@Param('sessionId') sessionId: string): Promise<AnchorResult> {
    return this.anchor.anchorSession(sessionId);
  }
}
