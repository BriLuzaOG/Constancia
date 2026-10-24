import { EVENT_KIND, type KernelEvent } from 'src/capture/kernel-event';

export interface ExecutionUnit {
  pid: number;
  /** null when the process forked but never called execve (e.g. a bash subshell). */
  ppid: number | null;
  file: string | null;
  argv: string[];
  stdout: Buffer;
  stderr: Buffer;
  exitCode: number | null;
  startedAt: number | null;
  endedAt: number | null;
}

const STDERR_FD = 2;

/** Assembles kernel events by PID: execve → writes to fd 1/2 → exit_group. */
export class ExecutionUnits {
  private readonly units: ExecutionUnit[] = [];
  private readonly byPid = new Map<number, ExecutionUnit>();

  apply(event: KernelEvent): void {
    switch (event.kind) {
      case EVENT_KIND.EXEC: {
        const unit = this.open(event.pid);
        // A second execve in a live pid is PATH search retrying: the last one wins.
        unit.ppid = event.payload.ppid;
        unit.file = event.payload.file;
        unit.argv = [];
        unit.startedAt = event.ts;
        break;
      }
      case EVENT_KIND.ARG:
        this.open(event.pid).argv[event.payload.index] = event.payload.value;
        break;
      case EVENT_KIND.OUT: {
        const unit = this.open(event.pid);
        if (event.payload.fd === STDERR_FD) {
          unit.stderr = Buffer.concat([unit.stderr, event.payload.bytes]);
        } else {
          unit.stdout = Buffer.concat([unit.stdout, event.payload.bytes]);
        }
        break;
      }
      case EVENT_KIND.EXIT: {
        const unit = this.open(event.pid);
        unit.exitCode = event.payload.code;
        unit.endedAt = event.ts;
        break;
      }
      case EVENT_KIND.NET:
        break;
    }
  }

  all(): ExecutionUnit[] {
    return this.units;
  }

  /** argv of every known ancestor, root first, ending with the unit of `pid`. */
  chain(pid: number): string[][] {
    const chain: string[][] = [];
    let unit = this.byPid.get(pid);
    while (unit) {
      chain.unshift(unit.argv);
      unit = unit.ppid === null ? undefined : this.byPid.get(unit.ppid);
    }
    return chain;
  }

  // Returns the live unit for pid, or starts one if none exists or the last one exited.
  private open(pid: number): ExecutionUnit {
    const current = this.byPid.get(pid);
    if (current?.endedAt === null) {
      return current;
    }
    const unit: ExecutionUnit = {
      pid,
      ppid: null,
      file: null,
      argv: [],
      stdout: Buffer.alloc(0),
      stderr: Buffer.alloc(0),
      exitCode: null,
      startedAt: null,
      endedAt: null,
    };
    this.units.push(unit);
    this.byPid.set(pid, unit);
    return unit;
  }
}
