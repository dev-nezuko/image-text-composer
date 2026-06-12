import * as fabric from 'fabric';

export const createCanvas = (canvasElement: HTMLCanvasElement): fabric.Canvas => {
  const canvas = new fabric.Canvas(canvasElement, {
    backgroundColor: '#f8f9fa',
    selection: true,
    preserveObjectStacking: true,
    // Add these options for better image handling
    allowTouchScrolling: false,
    renderOnAddRemove: true, // Enable automatic rendering on add/remove
    skipOffscreen: false // Ensure all objects are rendered
  });

  // Enable object caching for better performance
  fabric.Object.prototype.objectCaching = true;

  // Set default canvas dimensions
  canvas.setDimensions({ width: 800, height: 600 });

  return canvas;
};

export const addTextToCanvas = (canvas: fabric.Canvas, options: {
  text: string;
  left: number;
  top: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fill: string;
  opacity: number;
  textAlign: string;
}): fabric.IText => {
  const textObject = new fabric.IText(options.text, {
    left: options.left,
    top: options.top,
    fontFamily: options.fontFamily,
    fontSize: options.fontSize,
    fontWeight: options.fontWeight,
    fill: options.fill,
    opacity: options.opacity,
    textAlign: options.textAlign,
    cornerStyle: 'circle',
    cornerColor: '#3b82f6',
    cornerStrokeColor: '#ffffff',
    cornerSize: 8,
    transparentCorners: false,
  });

  canvas.add(textObject);
  canvas.setActiveObject(textObject);
  canvas.renderAll();

  return textObject;
};

export const updateTextObject = (textObject: fabric.Text, updates: Partial<{
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fill: string;
  opacity: number;
  textAlign: string;
}>) => {
  Object.keys(updates).forEach(key => {
    if (updates[key as keyof typeof updates] !== undefined) {
      textObject.set(key as keyof fabric.Text, updates[key as keyof typeof updates]);
    }
  });

  textObject.canvas?.renderAll();
};

export const exportCanvasToPNG = (canvas: fabric.Canvas): string => {
  const background = canvas.backgroundImage;
  const width = Math.round(background?.width || canvas.width);
  const height = Math.round(background?.height || canvas.height);
  const multiplier = background?.width && canvas.width ? background.width / canvas.width : 1;
  let rendered = canvas.toCanvasElement(multiplier);
  if (rendered.width === width && rendered.height === height) return rendered.toDataURL('image/png');
  // Fabric can truncate a fractional working dimension. Overscan, then crop
  // without rescaling the pixels to preserve the exact uploaded bounds.
  rendered = canvas.toCanvasElement(multiplier, {
    width: Math.ceil(width / multiplier) + 1,
    height: Math.ceil(height / multiplier) + 1,
  });
  const exact = document.createElement('canvas');
  exact.width = width;
  exact.height = height;
  const context = exact.getContext('2d');
  if (!context) throw new Error('PNG export is unavailable in this browser.');
  context.drawImage(rendered, 0, 0, width, height, 0, 0, width, height);
  return exact.toDataURL('image/png');
};
