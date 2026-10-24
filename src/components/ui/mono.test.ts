import { describe, expect, it } from 'vitest';
import { shortenMiddle } from './mono';

describe('shortenMiddle', () => {
  it('returns values of 24 characters or fewer unchanged', () => {
    const value = 'a'.repeat(24);
    expect(shortenMiddle(value)).toBe(value);
  });

  it('keeps the first 10 and last 8 characters of a long hash around an ellipsis', () => {
    const value = `0x${'0123456789abcdef'.repeat(4)}`;
    expect(value).toHaveLength(66);
    const result = shortenMiddle(value);
    expect(result).toBe(`${value.slice(0, 10)}…${value.slice(-8)}`);
    expect(result).toHaveLength(19);
  });

  it('never includes the middle of the value', () => {
    const value = `0x${'0123456789abcdef'.repeat(4)}`;
    expect(shortenMiddle(value)).not.toContain(value.slice(10, -8));
  });
});
