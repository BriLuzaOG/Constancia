import { describe, expect, test } from 'vitest';
import { formatAge, formatBlock, shortHash } from './format';

describe('ledger formatting', () => {
  test('shortHash keeps short values and ellipsises long ones', () => {
    expect(shortHash('0x1f9a')).toBe('0x1f9a');
    expect(shortHash(`0x${'ab'.repeat(32)}`)).toBe('0xabababab…abababab');
  });

  test('formatBlock groups thousands', () => {
    expect(formatBlock(7_000_123)).toBe('Block 7,000,123');
  });

  test('formatAge steps through seconds, minutes, hours and days', () => {
    const now = 1_800_000_000_000;
    const ago = (seconds: number) => formatAge(now / 1000 - seconds, now);
    expect(ago(5)).toBe('5 s ago');
    expect(ago(120)).toBe('2 min ago');
    expect(ago(3 * 3600)).toBe('3 h ago');
    expect(ago(2 * 86_400)).toBe('2 d ago');
    expect(formatAge(now / 1000 + 30, now)).toBe('0 s ago');
  });
});
