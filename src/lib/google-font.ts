import type { GoogleFont } from '@/lib/types';

const fontsLoaded = new Set<string>();

const FALLBACK_FONTS: GoogleFont[] = [
  { family: 'Inter', variants: ['400','700'], category: 'sans-serif' },
  { family: 'Roboto', variants: ['400','700'], category: 'sans-serif' },
];

export async function loadGoogleFonts(): Promise<GoogleFont[]> {
  const key = process.env.NEXT_PUBLIC_GOOGLE_FONTS_API_KEY;
  if (!key) return FALLBACK_FONTS;
  const res = await fetch(`https://webfonts.googleapis.com/v1/webfonts?key=${key}&sort=alpha`);
  if (!res.ok) return FALLBACK_FONTS;
  const data = await res.json();
  return (data.items ?? []) as GoogleFont[];
}

export const loadFont = async (fontFamily: string): Promise<void> => {
  if (fontsLoaded.has(fontFamily) || isWebSafeFont(fontFamily)) {
    return;
  }

  try {
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(' ', '+')}:wght@100;200;300;400;500;600;700;800;900&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Wait for font to load
    await new Promise((resolve) => {
      const checkFont = () => {
        if (document.fonts.check(`16px "${fontFamily}"`)) {
          resolve(void 0);
        } else {
          setTimeout(checkFont, 100);
        }
      };
      checkFont();
    });

    fontsLoaded.add(fontFamily);
  } catch (error) {
    console.error(`Failed to load font ${fontFamily}:`, error);
  }
};

export async function ensureFontLoaded(family: string, weight: string | number = 400) {
  const w = typeof weight === 'number' ? weight : (weight === 'bold' ? 700 : 400);
  const id = `gf-${family.replace(/\s+/g, '-').toLowerCase()}-${w}`;
  if (!document.getElementById(id)) {
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${w}&display=swap`;
    document.head.appendChild(link);
  }
  try {
    await (document as any).fonts.load(`${w} 16px ${family}`);
    await (document as any).fonts.ready;
  } catch {}
}

const isWebSafeFont = (fontFamily: string): boolean => {
  const webSafeFonts = [
    'Arial', 'Helvetica', 'Times New Roman', 'Times', 'Courier New', 'Courier',
    'Verdana', 'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
    'Trebuchet MS', 'Arial Black', 'Impact'
  ];
  return webSafeFonts.includes(fontFamily);
};

const getCommonFonts = (): GoogleFont[] => [
  { family: 'Arial', variants: ['400', '700'], category: 'sans-serif' },
  { family: 'Roboto', variants: ['100', '300', '400', '500', '700', '900'], category: 'sans-serif' },
  { family: 'Open Sans', variants: ['300', '400', '600', '700'], category: 'sans-serif' },
  { family: 'Lato', variants: ['100', '300', '400', '700', '900'], category: 'sans-serif' },
  { family: 'Montserrat', variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], category: 'sans-serif' },
  { family: 'Poppins', variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], category: 'sans-serif' },
  { family: 'Source Sans Pro', variants: ['200', '300', '400', '600', '700', '900'], category: 'sans-serif' },
  { family: 'Oswald', variants: ['200', '300', '400', '500', '600', '700'], category: 'sans-serif' },
];