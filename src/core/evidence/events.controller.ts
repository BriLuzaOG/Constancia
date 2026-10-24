import { Controller, Sse } from '@nestjs/common';
import { type Observable, map, merge, of } from 'rxjs';
import { EvidenceStore } from './evidence.store';

type SseMessage = { data: { at: number } };

@Controller()
export class EventsController {
  constructor(private readonly store: EvidenceStore) {}

  @Sse('events')
  stream(): Observable<SseMessage> {
    const initial = of({ data: { at: Date.now() } });
    const updates = this.store.changes$.pipe(map(() => ({ data: { at: Date.now() } })));

    return merge(initial, updates);
  }
}
