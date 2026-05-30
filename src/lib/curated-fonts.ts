import type { GoogleFont } from '@/lib/types';

/**
 * A curated set of Google Fonts, available without an API key.
 *
 * The editor previously fell back to exactly two families (Inter and Roboto)
 * unless NEXT_PUBLIC_GOOGLE_FONTS_API_KEY was set, while the README advertised
 * "Access to 200+ popular Google Fonts". Nobody cloning the repository had that
 * key, so the headline typography feature was two fonts.
 *
 * The key is only needed to *enumerate* the catalogue via the Web Fonts API.
 * Loading a font does not need one — `fonts.googleapis.com/css2` is public. So
 * the default is this list, which covers the families people actually reach
 * for, and a key still unlocks the full catalogue.
 */
export const CURATED_FONTS: GoogleFont[] = [
  { family: 'Inter', variants: ['300','400','500','600','700'], category: 'sans-serif' },
  { family: 'Roboto', variants: ['300','400','500','600','700'], category: 'sans-serif' },
  { family: 'Open Sans', variants: ['300','400','500','600','700'], category: 'sans-serif' },
  { family: 'Lato', variants: ['300','400','500','600','700'], category: 'sans-serif' },
  { family: 'Montserrat', variants: ['300','400','500','600','700'], category: 'sans-serif' },
  { family: 'Poppins', variants: ['300','400','500','600','700'], category: 'sans-serif' },
  { family: 'Raleway', variants: ['300','400','500','600','700'], category: 'sans-serif' },
  { family: 'Nunito', variants: ['300','400','500','600','700'], category: 'sans-serif' },
  { family: 'Work Sans', variants: ['300','400','500','600','700'], category: 'sans-serif' },
  { family: 'Rubik', variants: ['300','400','500','600','700'], category: 'sans-serif' },
  { family: 'Karla', variants: ['300','400','500','600','700'], category: 'sans-serif' },
  { family: 'Manrope', variants: ['300','400','500','600','700'], category: 'sans-serif' },
  { family: 'DM Sans', variants: ['300','400','500','600','700'], category: 'sans-serif' },
  { family: 'Outfit', variants: ['300','400','500','600','700'], category: 'sans-serif' },
  { family: 'Plus Jakarta Sans', variants: ['300','400','500','600','700'], category: 'sans-serif' },
  { family: 'Source Sans 3', variants: ['300','400','500','600','700'], category: 'sans-serif' },
  { family: 'Barlow', variants: ['300','400','500','600','700'], category: 'sans-serif' },
  { family: 'Mulish', variants: ['300','400','500','600','700'], category: 'sans-serif' },
  { family: 'Figtree', variants: ['300','400','500','600','700'], category: 'sans-serif' },
  { family: 'Oswald', variants: ['300','400','500','600','700'], category: 'sans-serif' },
  { family: 'Bebas Neue', variants: ['300','400','500','600','700'], category: 'display' },
  { family: 'Anton', variants: ['300','400','500','600','700'], category: 'display' },
  { family: 'Archivo Black', variants: ['300','400','500','600','700'], category: 'display' },
  { family: 'Playfair Display', variants: ['300','400','500','600','700'], category: 'serif' },
  { family: 'Merriweather', variants: ['300','400','500','600','700'], category: 'serif' },
  { family: 'Lora', variants: ['300','400','500','600','700'], category: 'serif' },
  { family: 'PT Serif', variants: ['300','400','500','600','700'], category: 'serif' },
  { family: 'Source Serif 4', variants: ['300','400','500','600','700'], category: 'serif' },
  { family: 'Libre Baskerville', variants: ['300','400','500','600','700'], category: 'serif' },
  { family: 'Crimson Text', variants: ['300','400','500','600','700'], category: 'serif' },
  { family: 'EB Garamond', variants: ['300','400','500','600','700'], category: 'serif' },
  { family: 'Cormorant Garamond', variants: ['300','400','500','600','700'], category: 'serif' },
  { family: 'Bitter', variants: ['300','400','500','600','700'], category: 'serif' },
  { family: 'Arvo', variants: ['300','400','500','600','700'], category: 'serif' },
  { family: 'Roboto Slab', variants: ['300','400','500','600','700'], category: 'serif' },
  { family: 'Zilla Slab', variants: ['300','400','500','600','700'], category: 'serif' },
  { family: 'Domine', variants: ['300','400','500','600','700'], category: 'serif' },
  { family: 'Dancing Script', variants: ['300','400','500','600','700'], category: 'handwriting' },
  { family: 'Pacifico', variants: ['300','400','500','600','700'], category: 'handwriting' },
  { family: 'Caveat', variants: ['300','400','500','600','700'], category: 'handwriting' },
  { family: 'Satisfy', variants: ['300','400','500','600','700'], category: 'handwriting' },
  { family: 'Great Vibes', variants: ['300','400','500','600','700'], category: 'handwriting' },
  { family: 'Sacramento', variants: ['300','400','500','600','700'], category: 'handwriting' },
  { family: 'Permanent Marker', variants: ['300','400','500','600','700'], category: 'handwriting' },
  { family: 'Shadows Into Light', variants: ['300','400','500','600','700'], category: 'handwriting' },
  { family: 'Kalam', variants: ['300','400','500','600','700'], category: 'handwriting' },
  { family: 'Lobster', variants: ['300','400','500','600','700'], category: 'display' },
  { family: 'Righteous', variants: ['300','400','500','600','700'], category: 'display' },
  { family: 'Alfa Slab One', variants: ['300','400','500','600','700'], category: 'display' },
  { family: 'Fredoka', variants: ['300','400','500','600','700'], category: 'display' },
  { family: 'Titan One', variants: ['300','400','500','600','700'], category: 'display' },
  { family: 'Bungee', variants: ['300','400','500','600','700'], category: 'display' },
  { family: 'Comfortaa', variants: ['300','400','500','600','700'], category: 'display' },
  { family: 'Josefin Sans', variants: ['300','400','500','600','700'], category: 'sans-serif' },
  { family: 'Quicksand', variants: ['300','400','500','600','700'], category: 'sans-serif' },
  { family: 'Cabin', variants: ['300','400','500','600','700'], category: 'sans-serif' },
  { family: 'Exo 2', variants: ['300','400','500','600','700'], category: 'sans-serif' },
  { family: 'Teko', variants: ['300','400','500','600','700'], category: 'sans-serif' },
  { family: 'Roboto Mono', variants: ['300','400','500','600','700'], category: 'monospace' },
  { family: 'JetBrains Mono', variants: ['300','400','500','600','700'], category: 'monospace' },
  { family: 'Fira Code', variants: ['300','400','500','600','700'], category: 'monospace' },
  { family: 'IBM Plex Mono', variants: ['300','400','500','600','700'], category: 'monospace' },
  { family: 'Space Mono', variants: ['300','400','500','600','700'], category: 'monospace' },
  { family: 'Inconsolata', variants: ['300','400','500','600','700'], category: 'monospace' },
];
