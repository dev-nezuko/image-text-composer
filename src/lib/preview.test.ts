import { describe, expect, it } from 'vitest';
import { fitPreview } from '@/lib/preview';

const MAX = { width: 800, height: 600 };

describe('fitPreview', () => {
  it('limits a wide image by width', () => {
    expect(fitPreview({ width: 1600, height: 800 }, MAX)).toEqual({ width: 800, height: 400, scale: 0.5 });
  });

  it('limits a tall image by height', () => {
    expect(fitPreview({ width: 600, height: 1200 }, MAX)).toEqual({ width: 300, height: 600, scale: 0.5 });
  });

  it('scales a small image up to fill the preview', () => {
    const fit = fitPreview({ width: 400, height: 300 }, MAX);
    expect(fit).toEqual({ width: 800, height: 600, scale: 2 });
  });

  it('keeps the aspect ratio so export can recover the source size', () => {
    const image = { width: 4032, height: 3024 };
    const fit = fitPreview(image, MAX);
    expect(fit.width / fit.scale).toBeCloseTo(image.width);
    expect(fit.height / fit.scale).toBeCloseTo(image.height);
  });
});
