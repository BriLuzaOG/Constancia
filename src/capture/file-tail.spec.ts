import { appendFile, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FileTail } from './file-tail';

describe('FileTail', () => {
  let dir: string;
  let path: string;
  let lines: string[];
  let tail: FileTail;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'file-tail-'));
    path = join(dir, 'capture.jsonl');
    lines = [];
    tail = new FileTail(path, (line) => lines.push(line));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('waits while the file does not exist yet', async () => {
    await tail.poll();
    await writeFile(path, 'a\n');
    await tail.poll();

    expect(lines).toEqual(['a']);
  });

  it('emits a line only once it is complete', async () => {
    await writeFile(path, 'first\nsec');
    await tail.poll();
    expect(lines).toEqual(['first']);

    await appendFile(path, 'ond\n');
    await tail.poll();
    expect(lines).toEqual(['first', 'second']);
  });

  it('starts over when the file is truncated', async () => {
    await writeFile(path, 'old line\n');
    await tail.poll();
    await writeFile(path, 'new\n');
    await tail.poll();

    expect(lines).toEqual(['old line', 'new']);
  });

  it('keeps a multibyte character split across two reads', async () => {
    const bytes = Buffer.from('ñ\n');
    await writeFile(path, bytes.subarray(0, 1));
    await tail.poll();
    await appendFile(path, bytes.subarray(1));
    await tail.poll();

    expect(lines).toEqual(['ñ']);
  });
});
