import { describe, expect, it } from 'vitest';
import { hasAllowedSignature } from '../src/middleware/uploads.js';

describe('attachment signature validation', () => {
  it('accepts allowed PNG and PDF signatures', () => {
    expect(hasAllowedSignature(Buffer.from([137,80,78,71,13,10,26,10]), 'image/png')).toBe(true);
    expect(hasAllowedSignature(Buffer.from('%PDF-1.7'), 'application/pdf')).toBe(true);
  });
  it('rejects a file whose claimed MIME type does not match its content', () => {
    expect(hasAllowedSignature(Buffer.from('not a JPEG'), 'image/jpeg')).toBe(false);
    expect(hasAllowedSignature(Buffer.from('%PDF-1.7'), 'image/png')).toBe(false);
  });
});
