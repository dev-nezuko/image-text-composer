'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import * as fabric from 'fabric';
import type { EditorState, TextStyleUpdate } from '@/lib/types';
import {
  BLANK_CANVAS,
  addTextToCanvas,
  createCanvas,
  exportCanvasToPNG,
  findLayer,
  isTextObject,
  readLayers,
} from '@/lib/fabric-utils';
import { ensureFontLoaded } from '@/lib/google-font';
import { pushSnapshot } from '@/lib/history';
import { displayScale, fitPreview, type Size } from '@/lib/preview';

const MAX_HISTORY = 20;
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const MAX_UPLOAD_PIXELS = 16_000_000;
const PREVIEW_MAX = { width: 800, height: 600 };
const SNAP_DISTANCE = 20;
const ROTATION_STEP = 15;

const newLayerId = () => `text_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

const initialState = (): EditorState => ({
  backgroundImage: null,
  textLayers: [],
  selectedLayerId: null,
  canvasWidth: BLANK_CANVAS.width,
  canvasHeight: BLANK_CANVAS.height,
  history: [],
  historyIndex: -1,
});

export const useEditor = () => {
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const [editorState, setEditorState] = useState<EditorState>(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const viewport = useRef<Size>({ width: 0, height: 0 });
  const styleSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modificationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoring = useRef(false);

  useEffect(() => () => {
    if (styleSaveTimer.current) clearTimeout(styleSaveTimer.current);
    if (modificationTimer.current) clearTimeout(modificationTimer.current);
    void canvasRef.current?.dispose();
    canvasRef.current = null;
  }, []);

  // The drawing buffer keeps the preview size; on narrow screens only the CSS
  // size shrinks. Fabric maps pointer positions through that CSS scale.
  const applyDisplaySize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const k = displayScale(canvas, viewport.current);
    canvas.setDimensions({ width: canvas.width * k, height: canvas.height * k }, { cssOnly: true });
  }, []);

  const resizeCanvas = useCallback((size: Size) => {
    canvasRef.current?.setDimensions(size);
    applyDisplaySize();
  }, [applyDisplaySize]);

  const fitToViewport = useCallback((box: Size) => {
    viewport.current = box;
    applyDisplaySize();
  }, [applyDisplaySize]);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || restoring.current) return;
    const canvasJSON = canvas.toObject(['id']) as Record<string, unknown>;
    const textLayers = readLayers(canvas);
    setEditorState(prev => {
      const { history, historyIndex, ...state } = prev;
      const cursor = pushSnapshot({ history, historyIndex }, { ...state, textLayers, canvasJSON }, MAX_HISTORY);
      return cursor ? { ...prev, textLayers, ...cursor } : prev;
    });
  }, []);

  const initCanvas = useCallback((canvasElement: HTMLCanvasElement) => {
    canvasRef.current?.dispose();
    const canvas = createCanvas(canvasElement);
    canvasRef.current = canvas;
    applyDisplaySize();

    // Clicking from one layer straight onto another fires selection:updated,
    // not selection:created, so both must move the panel selection.
    const syncSelection = (e: { selected?: fabric.FabricObject[] }) => {
      const obj = e.selected?.[0];
      if (isTextObject(obj)) {
        setEditorState(prev => ({ ...prev, selectedLayerId: obj.id || null }));
      }
    };
    canvas.on('selection:created', syncSelection);
    canvas.on('selection:updated', syncSelection);
    canvas.on('selection:cleared', () => {
      setEditorState(prev => ({ ...prev, selectedLayerId: null }));
    });

    // Drags and nudges fire this in bursts; record one history step per burst.
    canvas.on('object:modified', () => {
      if (modificationTimer.current) clearTimeout(modificationTimer.current);
      modificationTimer.current = setTimeout(saveToHistory, 100);
    });

    canvas.on('object:moving', ({ target }) => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      if (Math.abs(target.left - centerX) < SNAP_DISTANCE) target.left = centerX;
      if (Math.abs(target.top - centerY) < SNAP_DISTANCE) target.top = centerY;
    });

    saveToHistory();
  }, [applyDisplaySize, saveToHistory]);

  const loadImage = useCallback((file: File) => {
    if (!canvasRef.current) return;

    if (file.type !== 'image/png' || file.size > MAX_UPLOAD_BYTES) {
      setError(`${file.name} is not a PNG of 20 MB or less.`);
      return;
    }
    setError(null);
    setIsLoading(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const imgSrc = e.target?.result as string;

      fabric.Image.fromURL(imgSrc)
        .then((img) => {
          const canvas = canvasRef.current;
          if (!canvas) throw new Error('Canvas not available');
          if (!img.width || !img.height || img.width * img.height > MAX_UPLOAD_PIXELS) {
            throw new Error('the image is larger than 16 megapixels');
          }

          canvas.discardActiveObject();
          canvas.remove(...canvas.getObjects());

          // Fit the preview inside PREVIEW_MAX; export scales back up to the source size.
          const { width: canvasWidth, height: canvasHeight, scale } = fitPreview(img, PREVIEW_MAX);
          resizeCanvas({ width: canvasWidth, height: canvasHeight });

          // Fabric 7 positions objects by their centre by default. Anchor the
          // background at its top-left corner, otherwise it is drawn centred on
          // (0, 0) and only its bottom-right quarter is visible and exported.
          img.set({ originX: 'left', originY: 'top', left: 0, top: 0, scaleX: scale, scaleY: scale });
          canvas.backgroundImage = img;
          canvas.requestRenderAll();

          setEditorState(prev => ({
            ...prev,
            backgroundImage: imgSrc,
            canvasWidth,
            canvasHeight,
            exportScale: img.width / canvasWidth,
            textLayers: [],
            selectedLayerId: null,
          }));

          saveToHistory();
          setIsLoading(false);
        })
        .catch((err: unknown) => {
          setError(`Could not open ${file.name}: ${err instanceof Error ? err.message : 'the file could not be decoded'}.`);
          setIsLoading(false);
        });
    };

    reader.onerror = () => {
      setIsLoading(false);
      setError(`Could not read ${file.name}.`);
    };

    reader.readAsDataURL(file);
  }, [resizeCanvas, saveToHistory]);

  const addTextLayer = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const textObject = addTextToCanvas(canvas, {
      id: newLayerId(),
      text: 'Your Text Here',
      left: canvas.width / 2,
      top: canvas.height / 2,
      fontFamily: 'Arial',
      fontSize: 32,
      fontWeight: 'normal',
      fill: '#000000',
      opacity: 1,
      textAlign: 'center',
    });

    setEditorState(prev => ({
      ...prev,
      selectedLayerId: textObject.id,
      textLayers: [...prev.textLayers, { id: textObject.id, text: textObject.text, visible: true, locked: false }],
    }));

    saveToHistory();
  }, [saveToHistory]);

  const updateTextProperties = useCallback((updates: TextStyleUpdate) => {
    const canvas = canvasRef.current;
    const target = canvas?.getActiveObject();
    if (!canvas || !editorState.selectedLayerId || !isTextObject(target)) return;

    const { rotation, ...style } = updates;
    const apply = () => {
      const changes: Record<string, unknown> = Object.fromEntries(
        Object.entries(style).filter(([, value]) => value !== undefined),
      );
      if (rotation) changes.angle = (target.angle || 0) + (rotation === 'left' ? -ROTATION_STEP : ROTATION_STEP);
      if (Object.keys(changes).length === 0) return;

      target.set(changes);
      target.initDimensions();
      target.setCoords();
      canvas.requestRenderAll();

      // Sliders and typing send many updates; record one history step once they settle.
      if (styleSaveTimer.current) clearTimeout(styleSaveTimer.current);
      styleSaveTimer.current = setTimeout(() => canvas.fire('object:modified', { target }), 300);
    };

    if (style.fontFamily || style.fontWeight) {
      ensureFontLoaded(style.fontFamily ?? target.fontFamily, style.fontWeight ?? target.fontWeight).then(apply);
    } else {
      apply();
    }
  }, [editorState.selectedLayerId]);

  const deleteSelectedLayer = useCallback(() => {
    const canvas = canvasRef.current;
    const target = canvas?.getActiveObject();
    if (!canvas || !target) return;

    canvas.remove(target);
    setEditorState(prev => ({ ...prev, selectedLayerId: null }));
    saveToHistory();
  }, [saveToHistory]);

  const restoreHistory = useCallback(async (index: number) => {
    const canvas = canvasRef.current;
    const snapshot = editorState.history[index];
    if (!canvas || !snapshot?.canvasJSON || restoring.current) return;
    restoring.current = true;
    setIsLoading(true);
    try {
      await canvas.loadFromJSON(snapshot.canvasJSON);
      resizeCanvas({ width: snapshot.canvasWidth, height: snapshot.canvasHeight });
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      setEditorState(prev => ({ ...snapshot, selectedLayerId: null, history: prev.history, historyIndex: index }));
    } finally {
      restoring.current = false;
      setIsLoading(false);
    }
  }, [editorState.history, resizeCanvas]);

  const undo = useCallback(() => {
    if (editorState.historyIndex > 0) void restoreHistory(editorState.historyIndex - 1);
  }, [editorState.historyIndex, restoreHistory]);

  const redo = useCallback(() => {
    if (editorState.historyIndex < editorState.history.length - 1) void restoreHistory(editorState.historyIndex + 1);
  }, [editorState.historyIndex, editorState.history.length, restoreHistory]);

  const exportToPNG = useCallback(() => {
    if (!canvasRef.current) return null;
    return exportCanvasToPNG(canvasRef.current, editorState.exportScale || 1);
  }, [editorState.exportScale]);

  const selectLayer = useCallback((layerId: string) => {
    const canvas = canvasRef.current;
    const layer = canvas && findLayer(canvas, layerId);
    if (!canvas || !layer) return;
    canvas.setActiveObject(layer);
    canvas.requestRenderAll();
    setEditorState(prev => ({ ...prev, selectedLayerId: layerId }));
  }, []);

  const reorderLayer = useCallback((fromIndex: number, toIndex: number) => {
    const canvas = canvasRef.current;
    const target = canvas?.getObjects()[fromIndex];
    if (!canvas || !target) return;
    canvas.moveObjectTo(target, toIndex);
    canvas.requestRenderAll();
    saveToHistory();
  }, [saveToHistory]);

  const toggleLayerVisibility = useCallback((layerId: string) => {
    const canvas = canvasRef.current;
    const layer = canvas && findLayer(canvas, layerId);
    if (!canvas || !layer) return;
    layer.visible = !layer.visible;
    canvas.requestRenderAll();
    saveToHistory();
  }, [saveToHistory]);

  const toggleLayerLock = useCallback((layerId: string) => {
    const canvas = canvasRef.current;
    const layer = canvas && findLayer(canvas, layerId);
    if (!canvas || !layer) return;
    const locked = layer.selectable;
    layer.set({ selectable: !locked, evented: !locked });
    if (locked && canvas.getActiveObject() === layer) canvas.discardActiveObject();
    canvas.requestRenderAll();
    saveToHistory();
  }, [saveToHistory]);

  const deleteLayer = useCallback((layerId: string) => {
    const canvas = canvasRef.current;
    const layer = canvas && findLayer(canvas, layerId);
    if (!canvas || !layer) return;
    canvas.remove(layer);
    setEditorState(prev => ({
      ...prev,
      selectedLayerId: prev.selectedLayerId === layerId ? null : prev.selectedLayerId,
    }));
    saveToHistory();
  }, [saveToHistory]);

  const duplicateLayer = useCallback((layerId: string) => {
    const canvas = canvasRef.current;
    const layer = canvas && findLayer(canvas, layerId);
    if (!canvas || !layer) return;
    void layer.clone().then((copy) => {
      copy.id = newLayerId();
      copy.set({ left: copy.left + 20, top: copy.top + 20, selectable: true, evented: true });
      canvas.add(copy);
      canvas.setActiveObject(copy);
      canvas.requestRenderAll();
      setEditorState(prev => ({ ...prev, selectedLayerId: copy.id }));
      saveToHistory();
    });
  }, [saveToHistory]);

  const reset = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.discardActiveObject();
    canvas.clear();
    resizeCanvas(BLANK_CANVAS);
    canvas.backgroundColor = BLANK_CANVAS.color;
    canvas.requestRenderAll();
    setEditorState(initialState());
    setError(null);
    saveToHistory();
  }, [resizeCanvas, saveToHistory]);

  const dismissError = useCallback(() => setError(null), []);

  return {
    canvasRef,
    editorState,
    isLoading,
    error,
    dismissError,
    initCanvas,
    fitToViewport,
    loadImage,
    addTextLayer,
    updateTextProperties,
    deleteSelectedLayer,
    undo,
    redo,
    exportToPNG,
    reset,
    selectLayer,
    reorderLayer,
    toggleLayerVisibility,
    toggleLayerLock,
    deleteLayer,
    duplicateLayer,
  };
};
