import * as fabric from 'fabric';
import type { TextLayer, TextStyle } from '@/lib/types';

export const BLANK_CANVAS = { width: 800, height: 600, color: '#f8f9fa' };

/** A text object on the canvas, tagged with the id the layer panel uses. */
export type LayerObject = fabric.IText & { id: string };

export const isTextObject = (obj: fabric.FabricObject | null | undefined): obj is LayerObject =>
  obj instanceof fabric.Text;

export const findLayer = (canvas: fabric.Canvas, id: string): LayerObject | undefined =>
  canvas.getObjects().find((obj): obj is LayerObject => isTextObject(obj) && obj.id === id);

/** Text layers in stacking order, bottom first, as the layer panel shows them. */
export const readLayers = (canvas: fabric.Canvas): TextLayer[] =>
  canvas.getObjects().filter(isTextObject).map(obj => ({
    id: obj.id,
    text: obj.text,
    visible: obj.visible,
    locked: !obj.selectable,
  }));

export const createCanvas = (canvasElement: HTMLCanvasElement): fabric.Canvas => {
  const canvas = new fabric.Canvas(canvasElement, {
    backgroundColor: BLANK_CANVAS.color,
    selection: true,
    preserveObjectStacking: true,
    allowTouchScrolling: false,
    // Draw layers dragged partly outside the preview too, so nothing pops in and out.
    skipOffscreen: false,
  });
  canvas.setDimensions(BLANK_CANVAS);
  return canvas;
};

export const addTextToCanvas = (
  canvas: fabric.Canvas,
  options: TextStyle & { id: string; left: number; top: number },
): LayerObject => {
  const { id, text, textAlign, ...style } = options;
  const textObject = new fabric.IText(text, {
    ...style,
    textAlign: textAlign === 'right' || textAlign === 'center' ? textAlign : 'left',
    // Selection handles in the app's safelight accent.
    cornerStyle: 'circle',
    cornerColor: '#e3583a',
    borderColor: '#e3583a',
    cornerStrokeColor: '#ffffff',
    cornerSize: 8,
    transparentCorners: false,
  }) as LayerObject;
  textObject.id = id;

  canvas.add(textObject);
  canvas.setActiveObject(textObject);
  canvas.requestRenderAll();
  return textObject;
};

export const exportCanvasToPNG = (canvas: fabric.Canvas, multiplier = 1): string =>
  canvas.toDataURL({
    format: 'png',
    quality: 1,
    multiplier,
    enableRetinaScaling: false,
  });
