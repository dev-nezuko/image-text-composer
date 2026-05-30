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
    hasRotatingPoint: true,
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
  return canvas.toDataURL({
    format: 'png',
    quality: 1,
    multiplier: 1, // This ensures original dimensions are preserved
  });
};