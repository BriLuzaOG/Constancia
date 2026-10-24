import type { LookupFn } from '@/lib/credential/verify';
import type { LookupRequest, LookupResponse } from '@/lib/ledger/types';
import type { RecordedRequest } from './types';

const LOOKUP_PATH = '/api/ledger/lookup';
const UNREACHABLE = 'LEDGER_UNREACHABLE';

export function createRecordingLookup(): { lookup: LookupFn; requests: RecordedRequest[] } {
  const requests: RecordedRequest[] = [];

  const lookup = async (req: LookupRequest): Promise<LookupResponse> => {
    const body = JSON.stringify(req);
    requests.push({
      url: LOOKUP_PATH,
      method: 'POST',
      body,
      bytes: new TextEncoder().encode(body).length,
    });

    let res: Response;
    try {
      res = await fetch(LOOKUP_PATH, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
      });
    } catch {
      throw new Error(UNREACHABLE);
    }
    if (!res.ok) throw new Error(UNREACHABLE);
    // shortcut: trusting the gateway shape, the signature and ledger checks still bind it
    return (await res.json()) as LookupResponse;
  };

  return { lookup, requests };
}
