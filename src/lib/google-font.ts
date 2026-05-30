import type { GoogleFont } from '@/lib/types';
import { CURATED_FONTS } from '@/lib/curated-fonts';

// Installed on practically every system, so they need no stylesheet. New text
// layers default to Arial; listing these keeps the picker showing a value.
export const WEB_SAFE_FONTS: GoogleFont[] = [
  { family: 'Arial', variants: ['400', '700'], category: 'web-safe' },
  { family: 'Georgia', variants: ['400', '700'], category: 'web-safe' },
  { family: 'Courier New', variants: ['400', '700'], category: 'web-safe' },
  { family: 'Impact', variants: ['400'], category: 'web-safe' },
];

const FALLBACK_FONTS: GoogleFont[] = [...WEB_SAFE_FONTS, ...CURATED_FONTS];

export async function loadGoogleFonts(): Promise<GoogleFont[]> {
  const key = process.env.NEXT_PUBLIC_GOOGLE_FONTS_API_KEY;
  if (!key) return FALLBACK_FONTS;
  const res = await fetch(`https://webfonts.googleapis.com/v1/webfonts?key=${key}&sort=alpha`);
  if (!res.ok) return FALLBACK_FONTS;
  const data = await res.json();
  return [...WEB_SAFE_FONTS, ...((data.items ?? []) as GoogleFont[])];
}

export const isWebSafeFont = (family: string): boolean =>
  WEB_SAFE_FONTS.some(font => font.family === family) ||
  ['Helvetica', 'Times New Roman', 'Times', 'Courier', 'Verdana', 'Trebuchet MS', 'Arial Black'].includes(family);

/** Maps Fabric/CSS weights ('normal', 'bold', '600', 600) to a numeric weight. */
export function numericFontWeight(weight: string | number | undefined): number {
  if (typeof weight === 'number') return weight;
  if (weight === 'bold') return 700;
  const parsed = Number.parseInt(weight ?? '', 10);
  return Number.isFinite(parsed) ? parsed : 400;
}

const stylesheets = new Map<string, Promise<void>>();

// Resolves once the Google Fonts stylesheet has loaded (or failed), so the
// @font-face rules exist before document.fonts.load is asked for the face.
function loadStylesheet(family: string, weight: number): Promise<void> {
  const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`;
  let pending = stylesheets.get(href);
  if (!pending) {
    pending = new Promise(resolve => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = link.onerror = () => resolve();
      document.head.appendChild(link);
    });
    stylesheets.set(href, pending);
  }
  return pending;
}

export async function ensureFontLoaded(family: string, weight: string | number = 400) {
  if (isWebSafeFont(family)) return;
  const w = numericFontWeight(weight);
  await loadStylesheet(family, w);
  try {
    // Quoted, because families such as "Source Sans 3" are not valid bare identifiers.
    await document.fonts.load(`${w} 16px "${family}"`);
  } catch {
    // Offline or blocked: Fabric falls back to the browser's default face.
  }
}
