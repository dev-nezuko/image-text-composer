import { describe, expect, it } from 'vitest';
import { isWebSafeFont, loadGoogleFonts, numericFontWeight } from '@/lib/google-font';

describe('numericFontWeight', () => {
  it.each([
    ['normal', 400],
    ['bold', 700],
    ['600', 600],
    [300, 300],
    [undefined, 400],
  ] as const)('maps %s to %i', (weight, expected) => {
    expect(numericFontWeight(weight)).toBe(expected);
  });
});

describe('font list', () => {
  it('treats system families as needing no stylesheet', () => {
    expect(isWebSafeFont('Arial')).toBe(true);
    expect(isWebSafeFont('Times New Roman')).toBe(true);
    expect(isWebSafeFont('Playfair Display')).toBe(false);
  });

  it('offers the default family and the curated set without an API key', async () => {
    const fonts = await loadGoogleFonts();
    const families = fonts.map(font => font.family);
    expect(families[0]).toBe('Arial');
    expect(families).toContain('Playfair Display');
    expect(new Set(families).size).toBe(families.length);
  });
});
