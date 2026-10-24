import type { KernelEvent } from 'src/capture/kernel-event';
import { ExecutionUnits } from './execution-units';

function exec(pid: number, ppid: number, file: string, ts = 1): KernelEvent {
  return { kind: 'EXEC', ts, pid, payload: { ppid, comm: 'parent', file } };
}

function arg(pid: number, index: number, value: string): KernelEvent {
  return { kind: 'ARG', ts: 1, pid, payload: { index, value } };
}

function out(pid: number, fd: number, text: string): KernelEvent {
  return {
    kind: 'OUT',
    ts: 2,
    pid,
    payload: { comm: 'x', fd, size: text.length, bytes: Buffer.from(text) },
  };
}

function exit(pid: number, code: number, ts = 3): KernelEvent {
  return { kind: 'EXIT', ts, pid, payload: { comm: 'x', code } };
}

describe('ExecutionUnits', () => {
  it('assembles execve, argv, stdout, stderr and exit code into one unit', () => {
    const units = new ExecutionUnits();
    for (const event of [
      exec(10, 1, '/usr/bin/ls'),
      arg(10, 0, 'ls'),
      arg(10, 1, '-la'),
      out(10, 1, 'a\n'),
      out(10, 2, 'warn\n'),
      out(10, 1, 'b\n'),
      exit(10, 2),
    ]) {
      units.apply(event);
    }

    const [unit] = units.all();
    expect(unit).toMatchObject({
      pid: 10,
      ppid: 1,
      file: '/usr/bin/ls',
      argv: ['ls', '-la'],
      exitCode: 2,
      startedAt: 1,
      endedAt: 3,
    });
    expect(unit.stdout.toString()).toBe('a\nb\n');
    expect(unit.stderr.toString()).toBe('warn\n');
  });

  it('keeps the last execve when PATH search retries in the same pid', () => {
    const units = new ExecutionUnits();
    units.apply(exec(20, 1, '/usr/local/bin/which'));
    units.apply(arg(20, 0, 'which'));
    units.apply(exec(20, 1, '/usr/bin/which'));
    units.apply(arg(20, 0, 'which'));

    expect(units.all()).toHaveLength(1);
    expect(units.all()[0]).toMatchObject({ file: '/usr/bin/which', argv: ['which'] });
  });

  it('starts a new unit when a finished pid is reused', () => {
    const units = new ExecutionUnits();
    units.apply(exec(30, 1, '/bin/a'));
    units.apply(exit(30, 0));
    units.apply(exec(30, 1, '/bin/b'));

    expect(units.all().map((unit) => unit.file)).toEqual(['/bin/a', '/bin/b']);
  });

  it('records output from a forked process that never called execve', () => {
    const units = new ExecutionUnits();
    units.apply(out(40, 1, 'subshell\n'));

    expect(units.all()[0]).toMatchObject({ pid: 40, ppid: null, file: null });
    expect(units.all()[0].stdout.toString()).toBe('subshell\n');
  });

  it('returns the full argv chain from the root ancestor', () => {
    const units = new ExecutionUnits();
    units.apply(exec(50, 1, '/bin/bash'));
    units.apply(arg(50, 0, 'bash'));
    units.apply(arg(50, 1, '-c'));
    units.apply(arg(50, 2, 'pnpm test'));
    units.apply(exec(51, 50, '/usr/bin/pnpm'));
    units.apply(arg(51, 0, 'pnpm'));
    units.apply(arg(51, 1, 'test'));
    units.apply(exec(52, 51, '/usr/bin/node'));
    units.apply(arg(52, 0, 'node'));
    units.apply(arg(52, 1, 'vitest'));

    expect(units.chain(52)).toEqual([
      ['bash', '-c', 'pnpm test'],
      ['pnpm', 'test'],
      ['node', 'vitest'],
    ]);
  });
});
