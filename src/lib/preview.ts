export interface Size {
  width: number;
  height: number;
}

/**
 * Scales an image down (or up) to the largest size that fits inside `max`
 * while keeping its aspect ratio. Export multiplies by 1 / scale to get the
 * source resolution back.
 */
export function fitPreview(image: Size, max: Size): Size & { scale: number } {
  const scale = Math.min(max.width / image.width, max.height / image.height);
  return { width: image.width * scale, height: image.height * scale, scale };
}

/**
 * How much to shrink the on-screen canvas so it fits `box` (the space the
 * layout gives it). Never enlarges, and leaves the drawing buffer alone: only
 * the CSS size changes, so editing coordinates and export are unaffected.
 */
export function displayScale(canvas: Size, box: Size): number {
  if (box.width <= 0 || box.height <= 0) return 1;
  return Math.min(1, box.width / canvas.width, box.height / canvas.height);
}
