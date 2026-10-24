export const EVENT_KIND = {
  EXEC: 'EXEC',
  ARG: 'ARG',
  EXIT: 'EXIT',
  OUT: 'OUT',
  NET: 'NET',
} as const;

export type EventKind = (typeof EVENT_KIND)[keyof typeof EVENT_KIND];

export interface ExecPayload {
  ppid: number;
  comm: string;
  file: string;
}

export interface ArgPayload {
  index: number;
  value: string;
}

export interface ExitPayload {
  comm: string;
  code: number;
}

export interface OutPayload {
  comm: string;
  fd: number;
  size: number;
  bytes: Buffer;
}

export interface NetPayload {
  comm: string;
  family: number;
  ip: string;
  port: number;
}

interface BaseEvent {
  ts: number;
  pid: number;
}

export interface ExecEvent extends BaseEvent {
  kind: typeof EVENT_KIND.EXEC;
  payload: ExecPayload;
}

export interface ArgEvent extends BaseEvent {
  kind: typeof EVENT_KIND.ARG;
  payload: ArgPayload;
}

export interface ExitEvent extends BaseEvent {
  kind: typeof EVENT_KIND.EXIT;
  payload: ExitPayload;
}

export interface OutEvent extends BaseEvent {
  kind: typeof EVENT_KIND.OUT;
  payload: OutPayload;
}

export interface NetEvent extends BaseEvent {
  kind: typeof EVENT_KIND.NET;
  payload: NetPayload;
}

export type KernelEvent = ExecEvent | ArgEvent | ExitEvent | OutEvent | NetEvent;

/** bpftrace could not keep up and dropped events: the capture has a gap. */
export interface LostEvents {
  kind: 'LOST';
  count: number;
}
