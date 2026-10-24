import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { EvidenceStore } from './evidence.store';
import {
  type ChainVerification,
  type EvidenceEvent,
  type SessionHead,
  verifyChain,
} from './hash-chain';

type AppendBody = {
  sessionId: string;
  type: string;
  payload: unknown;
};

type SessionState = {
  sessionId: string;
  quarantined: boolean;
  head: SessionHead | null;
};

@Controller('api')
export class EvidenceController {
  constructor(private readonly store: EvidenceStore) {}

  @Post('events')
  append(@Body() body: AppendBody): EvidenceEvent {
    return this.store.append(body.sessionId, body.type, body.payload);
  }

  @Get('sessions')
  sessions(): string[] {
    return this.store.sessionIds();
  }

  @Delete('sessions/:sessionId')
  reset(@Param('sessionId') sessionId: string): { ok: boolean } {
    return { ok: this.store.reset(sessionId) };
  }

  @Get('sessions/:sessionId/state')
  state(@Param('sessionId') sessionId: string): SessionState {
    return {
      sessionId,
      quarantined: this.store.isQuarantined(sessionId),
      head: this.store.head(sessionId) ?? null,
    };
  }

  @Get('sessions/:sessionId/events')
  events(@Param('sessionId') sessionId: string): EvidenceEvent[] {
    return this.store.list(sessionId);
  }

  @Get('sessions/:sessionId/verify')
  verify(@Param('sessionId') sessionId: string): ChainVerification {
    // La cabeza se pasa aparte: si el rogue borra el último evento, el
    // hueco está entre el último presente y la cabeza.
    return verifyChain(this.store.list(sessionId), this.store.head(sessionId));
  }
}
