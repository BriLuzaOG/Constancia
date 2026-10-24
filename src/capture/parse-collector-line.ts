import { EVENT_KIND, type KernelEvent, type LostEvents } from './kernel-event';

// Fields per kind, without the leading tag. The last field takes the rest of the
// line, so tabs inside argv values or stdout bytes survive.
const FIELD_COUNT: Record<string, number> = {
  [EVENT_KIND.EXEC]: 5,
  [EVENT_KIND.ARG]: 4,
  [EVENT_KIND.EXIT]: 4,
  [EVENT_KIND.OUT]: 6,
  [EVENT_KIND.NET]: 6,
};

/**
 * Parses one line of `bpftrace -f json` output from scripts/actions.bt.
 * Returns null for records that carry no evidence (BOOT, attached_probes).
 */
export function parseCollectorLine(line: string): KernelEvent | LostEvents | null {
  const record = JSON.parse(line) as { type?: unknown; data?: unknown };

  if (record.type === 'lost_events') {
    const data = record.data as { events?: unknown };
    return { kind: 'LOST', count: Number(data.events) };
  }
  if (record.type !== 'printf' || typeof record.data !== 'string') {
    return null;
  }

  const data = record.data.endsWith('\n') ? record.data.slice(0, -1) : record.data;
  const tabIndex = data.indexOf('\t');
  const tag = tabIndex === -1 ? data : data.slice(0, tabIndex);
  const fieldCount = FIELD_COUNT[tag];
  if (fieldCount === undefined) {
    return null;
  }

  const fields = splitFields(data.slice(tabIndex + 1), fieldCount, tag);
  const ts = toInt(fields[0], tag);
  const pid = toInt(fields[1], tag);

  switch (tag) {
    case EVENT_KIND.EXEC:
      return {
        kind: EVENT_KIND.EXEC,
        ts,
        pid,
        payload: { ppid: toInt(fields[2], tag), comm: fields[3], file: fields[4] },
      };
    case EVENT_KIND.ARG:
      return {
        kind: EVENT_KIND.ARG,
        ts,
        pid,
        payload: { index: toInt(fields[2], tag), value: fields[3] },
      };
    case EVENT_KIND.EXIT:
      return {
        kind: EVENT_KIND.EXIT,
        ts,
        pid,
        payload: { comm: fields[2], code: toInt(fields[3], tag) },
      };
    case EVENT_KIND.OUT:
      return {
        kind: EVENT_KIND.OUT,
        ts,
        pid,
        payload: {
          comm: fields[2],
          fd: toInt(fields[3], tag),
          size: toInt(fields[4], tag),
          bytes: decodeEscapedBytes(fields[5]),
        },
      };
    default:
      return {
        kind: EVENT_KIND.NET,
        ts,
        pid,
        payload: {
          comm: fields[2],
          family: toInt(fields[3], tag),
          ip: fields[4],
          port: toInt(fields[5], tag),
        },
      };
  }
}

function splitFields(rest: string, count: number, tag: string): string[] {
  const fields: string[] = [];
  let start = 0;
  for (let i = 0; i < count - 1; i++) {
    const end = rest.indexOf('\t', start);
    if (end === -1) {
      throw new Error(`${tag}: expected ${count} fields in "${rest}"`);
    }
    fields.push(rest.slice(start, end));
    start = end + 1;
  }
  fields.push(rest.slice(start));
  return fields;
}

function toInt(value: string, tag: string): number {
  if (!/^-?\d+$/.test(value)) {
    throw new Error(`${tag}: "${value}" is not an integer`);
  }
  return Number(value);
}

// bpftrace %r keeps printable characters and writes every other byte as \xNN.
function decodeEscapedBytes(text: string): Buffer {
  const parts: Buffer[] = [];
  let last = 0;
  for (const match of text.matchAll(/\\x([0-9a-fA-F]{2})/g)) {
    parts.push(Buffer.from(text.slice(last, match.index), 'utf8'));
    parts.push(Buffer.from([Number.parseInt(match[1], 16)]));
    last = match.index + match[0].length;
  }
  parts.push(Buffer.from(text.slice(last), 'utf8'));
  return Buffer.concat(parts);
}
