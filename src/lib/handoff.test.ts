import { describe, expect, it } from 'vitest';
import { setHandoffFile, takeHandoffFile } from './handoff';

describe('handoff', () => {
  it('returns the set file once, then null', () => {
    const file = new File(['eyJ'], 'a.sdjwt', { type: 'text/plain' });
    setHandoffFile(file);
    expect(takeHandoffFile()).toBe(file);
    expect(takeHandoffFile()).toBeNull();
  });

  it('returns null when nothing was set', () => {
    expect(takeHandoffFile()).toBeNull();
  });
});
