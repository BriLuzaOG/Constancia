import { parseCollectorLine } from './parse-collector-line';

describe('parseCollectorLine', () => {
  it('parses EXEC with parent pid and filename', () => {
    const line =
      '{"type": "printf", "data": "EXEC\\t2945937384094\\t28815\\t28701\\tbash\\t/usr/bin/ls\\n"}';

    expect(parseCollectorLine(line)).toEqual({
      kind: 'EXEC',
      ts: 2945937384094,
      pid: 28815,
      payload: { ppid: 28701, comm: 'bash', file: '/usr/bin/ls' },
    });
  });

  it('keeps tabs and quotes inside an ARG value', () => {
    const line = '{"type": "printf", "data": "ARG\\t1\\t28816\\t2\\techo \\"a\\tb\\" && ls\\n"}';

    expect(parseCollectorLine(line)).toEqual({
      kind: 'ARG',
      ts: 1,
      pid: 28816,
      payload: { index: 2, value: 'echo "a\tb" && ls' },
    });
  });

  it('parses EXIT with the real exit code', () => {
    const line = '{"type": "printf", "data": "EXIT\\t2947210136441\\t28816\\tsh\\t127\\n"}';

    expect(parseCollectorLine(line)).toEqual({
      kind: 'EXIT',
      ts: 2947210136441,
      pid: 28816,
      payload: { comm: 'sh', code: 127 },
    });
  });

  it('decodes \\xNN escapes in OUT bytes', () => {
    const line =
      '{"type": "printf", "data": "OUT\\t2945938837578\\t28815\\tls\\t1\\t8\\tafs\\\\x0abin\\\\x0a\\n"}';

    expect(parseCollectorLine(line)).toEqual({
      kind: 'OUT',
      ts: 2945938837578,
      pid: 28815,
      payload: { comm: 'ls', fd: 1, size: 8, bytes: Buffer.from('afs\nbin\n') },
    });
  });

  it('parses NET with family, ip and port', () => {
    const line =
      '{"type": "printf", "data": "NET\\t2972697595394\\t26399\\tclaude\\t6\\t2607:6bc0::10\\t443\\n"}';

    expect(parseCollectorLine(line)).toEqual({
      kind: 'NET',
      ts: 2972697595394,
      pid: 26399,
      payload: { comm: 'claude', family: 6, ip: '2607:6bc0::10', port: 443 },
    });
  });

  it('reports events bpftrace dropped', () => {
    const line = '{"type": "lost_events", "data": {"events": 12}}';

    expect(parseCollectorLine(line)).toEqual({ kind: 'LOST', count: 12 });
  });

  it('ignores BOOT and non-printf records', () => {
    expect(
      parseCollectorLine('{"type": "printf", "data": "BOOT\\t1\\tharness=26399\\n"}'),
    ).toBeNull();
    expect(parseCollectorLine('{"type": "attached_probes", "data": {"probes": 5}}')).toBeNull();
  });

  it('throws on a malformed line instead of dropping it', () => {
    expect(() => parseCollectorLine('not json')).toThrow(/valid JSON/);
    expect(() =>
      parseCollectorLine('{"type": "printf", "data": "EXIT\\tx\\t1\\tsh\\t0\\n"}'),
    ).toThrow(/EXIT/);
  });
});
