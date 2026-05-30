import { describe, expect, it } from 'vitest';
import { displayScale, fitPreview } from '@/lib/preview';

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

describe('displayScale', () => {
  it('shrinks the canvas to the narrower side of a phone layout', () => {
    expect(displayScale({ width: 800, height: 400 }, { width: 358, height: 600 })).toBeCloseTo(358 / 800);
  });

  it('never enlarges a canvas that already fits', () => {
    expect(displayScale({ width: 800, height: 600 }, { width: 1200, height: 900 })).toBe(1);
  });

  it('is limited by height in a short, wide box', () => {
    expect(displayScale({ width: 800, height: 600 }, { width: 1000, height: 300 })).toBe(0.5);
  });

  it('ignores a box that has not been laid out yet', () => {
    expect(displayScale({ width: 800, height: 600 }, { width: 0, height: 0 })).toBe(1);
  });
});
