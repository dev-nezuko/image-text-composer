import type { GoogleFont } from '@/lib/types';
const ready = new Set<string>();
const pending = new Map<string, Promise<void>>();
const fallback: GoogleFont[] = ['Arial', 'Georgia', 'Verdana'].map(family => ({ family, variants: ['400', '700'], category: 'sans-serif' }));
const webSafe = new Set(['Arial', 'Helvetica', 'Times New Roman', 'Times', 'Courier New', 'Courier', 'Verdana', 'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS', 'Trebuchet MS', 'Arial Black', 'Impact']);
export async function loadGoogleFonts(): Promise<GoogleFont[]> {
  const key = process.env.NEXT_PUBLIC_GOOGLE_FONTS_API_KEY;
  if (!key) return fallback;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`https://webfonts.googleapis.com/v1/webfonts?key=${encodeURIComponent(key)}&sort=alpha`, {signal:controller.signal});
    if (!response.ok) return fallback;
    const data = await response.json();
    return Array.isArray(data.items) ? data.items : fallback;
  } catch { return fallback; }
  finally { clearTimeout(timer); }
}
export async function ensureFontLoaded(family: string, weight: string | number = 400): Promise<void> {
  if (webSafe.has(family)) return;
  const normalizedWeight = typeof weight === 'number' ? weight : weight === 'bold' ? 700 : 400;
  const key = `${family}:${normalizedWeight}`;
  if (ready.has(key)) return;
  if (pending.has(key)) return pending.get(key)!;
  const task = (async () => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${normalizedWeight}&display=swap`;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stylesheetLoaded = await new Promise<boolean>(resolve => {
      const finish = (loaded: boolean) => { clearTimeout(timer); link.onload=null; link.onerror=null; resolve(loaded); };
      timer = setTimeout(() => finish(false), 5000);
      link.onload=()=>finish(true);link.onerror=()=>finish(false);document.head.appendChild(link);
    });
    if (!stylesheetLoaded) {link.remove();return;}
    try {
      const loaded = await Promise.race([
        document.fonts.load(`${normalizedWeight} 16px "${family.replace(/"/g,'')}"`),
        new Promise<FontFace[]>(resolve => {timer=setTimeout(()=>resolve([]),5000);}),
      ]);
      if (loaded.length) ready.add(key);
    } catch { /* The canvas can continue with the browser's fallback font. */ }
    finally { clearTimeout(timer); }
  })();
  pending.set(key, task);
  try { await task; } finally { pending.delete(key); }
}
export function loadFont(family: string): Promise<void> { return ensureFontLoaded(family); }
