// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { InputError, inputFromText, parseShareFragment, readInputFile } from './load-input';
import { MAX_INPUT_BYTES } from './types';

const ID = 'a'.repeat(32);
const KEY = 'B'.repeat(43);

describe('parseShareFragment', () => {
  it('reads id and key from a fragment', () => {
    expect(parseShareFragment(`s=${ID}.${KEY}`)).toEqual({ id: ID, key: KEY });
  });

  it('accepts the leading #', () => {
    expect(parseShareFragment(`#s=${ID}.${KEY}`)).toEqual({ id: ID, key: KEY });
  });

  it('rejects an id that is not 32 lowercase hex chars', () => {
    expect(parseShareFragment(`s=${'A'.repeat(32)}.${KEY}`)).toBeNull();
    expect(parseShareFragment(`s=${'a'.repeat(31)}.${KEY}`)).toBeNull();
  });

  it('rejects a key that is not 43 base64url chars', () => {
    expect(parseShareFragment(`s=${ID}.${'B'.repeat(42)}`)).toBeNull();
    expect(parseShareFragment(`s=${ID}.${'+'.repeat(43)}`)).toBeNull();
  });

  it('rejects an empty fragment', () => {
    expect(parseShareFragment('')).toBeNull();
    expect(parseShareFragment('#')).toBeNull();
  });
});

describe('inputFromText', () => {
  it('detects a verified CV by its type', () => {
    const cv = JSON.stringify({ type: 'constancia-cv', entries: [] });
    expect(inputFromText(cv, 'paste').kind).toBe('cv');
  });

  it('treats other JSON and malformed JSON as a presentation', () => {
    expect(inputFromText(JSON.stringify({ type: 'other' }), 'paste').kind).toBe('presentation');
    expect(inputFromText('{not json', 'paste').kind).toBe('presentation');
    expect(inputFromText('eyJhbGciOi.payload~', 'file').kind).toBe('presentation');
  });

  it('trims the text and keeps origin and share id', () => {
    const input = inputFromText('  eyJ.a~  \n', 'link', ID);
    expect(input).toEqual({ text: 'eyJ.a~', kind: 'presentation', origin: 'link', shareId: ID });
  });

  it('rejects empty text', () => {
    expect(() => inputFromText(' \n\t ', 'paste')).toThrow(InputError);
  });

  it('rejects text over the byte limit', () => {
    expect(() => inputFromText('a'.repeat(MAX_INPUT_BYTES + 1), 'paste')).toThrow(InputError);
  });
});

describe('readInputFile', () => {
  it('rejects an oversized file without reading it', async () => {
    const text = () => {
      throw new Error('read');
    };
    const file = { size: MAX_INPUT_BYTES + 1, text } as unknown as File;
    await expect(readInputFile(file)).rejects.toBeInstanceOf(InputError);
  });
});
