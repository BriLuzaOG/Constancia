import { open, stat } from 'node:fs/promises';

const NEWLINE = 0x0a;

/** Follows a growing file and emits each complete line exactly once. */
export class FileTail {
  private offset = 0;
  private pending = Buffer.alloc(0);
  private polling = false;
  private timer: NodeJS.Timeout | undefined;

  constructor(
    private readonly path: string,
    private readonly onLine: (line: string) => void,
  ) {}

  start(intervalMs: number, onError: (error: unknown) => void): void {
    this.timer = setInterval(() => {
      void this.pollReportingErrors(onError);
    }, intervalMs);
  }

  stop(): void {
    clearInterval(this.timer);
  }

  async poll(): Promise<void> {
    if (this.polling) {
      return;
    }
    this.polling = true;
    try {
      await this.readNewBytes();
    } finally {
      this.polling = false;
    }
  }

  private async pollReportingErrors(onError: (error: unknown) => void): Promise<void> {
    try {
      await this.poll();
    } catch (error) {
      onError(error);
    }
  }

  private async readNewBytes(): Promise<void> {
    let size: number;
    try {
      size = (await stat(this.path)).size;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return;
      }
      throw error;
    }

    // scripts/collect.sh truncates the file when a new capture starts.
    if (size < this.offset) {
      this.offset = 0;
      this.pending = Buffer.alloc(0);
    }
    if (size === this.offset) {
      return;
    }

    const handle = await open(this.path, 'r');
    try {
      const chunk = Buffer.alloc(size - this.offset);
      const { bytesRead } = await handle.read(chunk, 0, chunk.length, this.offset);
      this.offset += bytesRead;
      this.emitLines(chunk.subarray(0, bytesRead));
    } finally {
      await handle.close();
    }
  }

  // Splits on raw bytes, not strings, so a UTF-8 character cut between reads stays intact.
  private emitLines(chunk: Buffer): void {
    let buffer = Buffer.concat([this.pending, chunk]);
    let newline = buffer.indexOf(NEWLINE);
    while (newline !== -1) {
      this.onLine(buffer.subarray(0, newline).toString('utf8'));
      buffer = buffer.subarray(newline + 1);
      newline = buffer.indexOf(NEWLINE);
    }
    this.pending = Buffer.from(buffer);
  }
}
