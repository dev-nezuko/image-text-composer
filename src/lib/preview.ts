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
