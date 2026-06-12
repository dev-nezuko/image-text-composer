'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import * as fabric from 'fabric';
import { EditorState, EditorSnapshot, TextLayer } from '@/lib/types';
import { createCanvas, addTextToCanvas, exportCanvasToPNG } from '@/lib/fabric-utils';
import { ensureFontLoaded } from '@/lib/google-font';
import { appendSnapshot } from '@/lib/editor-history';

const MAX_HISTORY = 20;

export const useEditor = () => {
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const [editorState, setEditorState] = useState<EditorState>({
    backgroundImage: null,
    textLayers: [],
    selectedLayerId: null,
    canvasWidth: 800,
    canvasHeight: 600,
    history: [],
    historyIndex: -1,
  });

  const [isLoading, setIsLoading] = useState(false);
  const styleSaveTimer = useRef<number | null>(null);
  const modificationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoring = useRef(false);
  const pendingDisposal = useRef<Promise<unknown>>(Promise.resolve());
  const clearPendingEdits = useCallback(() => {
    if (styleSaveTimer.current !== null) window.clearTimeout(styleSaveTimer.current);
    if (modificationTimer.current !== null) clearTimeout(modificationTimer.current);
    styleSaveTimer.current = null;
    modificationTimer.current = null;
  }, []);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || restoring.current) return;
    const canvasJSON = canvas.toObject(['id', 'selectable', 'evented']);
    const layers = canvas.getObjects().filter(obj => obj.type === 'text' || obj.type === 'i-text').map(obj => ({
      id: (obj as any).id || '', text: (obj as any).text || '', visible: obj.visible !== false,
      locked: !obj.selectable || !obj.evented,
    }));
    setEditorState(prev => {
      const document = { backgroundImage: prev.backgroundImage, textLayers: layers,
        selectedLayerId: prev.selectedLayerId, canvasWidth: prev.canvasWidth, canvasHeight: prev.canvasHeight };
      const snapshot: EditorSnapshot = { document, canvasJSON };
      return { ...document, ...appendSnapshot(prev.history, prev.historyIndex, snapshot, MAX_HISTORY) };
    });
  }, []);

  const initCanvas = useCallback((element: HTMLCanvasElement) => {
    let cancelled = false;
    let instance: fabric.Canvas | null = null;
    // Defer initialization so Strict Mode's first cleanup can cancel it.
    pendingDisposal.current.then(() => {
      if (cancelled) return;
      instance = createCanvas(element);
      canvasRef.current = instance;
      const updateSelection = (event: any) => {
        const selected = event.selected?.[0];
        setEditorState(prev => ({ ...prev, selectedLayerId: selected?.id || null }));
      };
      instance.on('selection:created', updateSelection);
      instance.on('selection:updated', updateSelection);
      instance.on('selection:cleared', () => setEditorState(prev => ({ ...prev, selectedLayerId: null })));
      const recordEdit = () => {
        if (restoring.current) return;
        if (modificationTimer.current !== null) clearTimeout(modificationTimer.current);
        modificationTimer.current = setTimeout(saveToHistory, 100);
      };
      instance.on('object:modified', recordEdit);
      instance.on('text:changed', recordEdit);
      instance.on('object:moving', event => {
        const object = event.target;
        if (!object || !instance) return;
        const x = instance.width / 2, y = instance.height / 2;
        if (Math.abs((object.left || 0) - x) < 20) object.left = x;
        if (Math.abs((object.top || 0) - y) < 20) object.top = y;
      });
      saveToHistory();
    });
    return () => {
      cancelled = true;
      if (instance) {
        if (canvasRef.current === instance) canvasRef.current = null;
        clearPendingEdits();
        pendingDisposal.current = instance.dispose().catch(() => undefined);
      }
    };
  }, [clearPendingEdits, saveToHistory]);

  const loadImage = useCallback((file: File) => {
    if (!canvasRef.current) return;
    if ((file.type !== 'image/png' && !file.name.toLowerCase().endsWith('.png')) || file.size > 8 * 1024 * 1024) {
      alert('Choose a PNG image up to 8 MiB.');
      return;
    }
    setIsLoading(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const imgSrc = e.target?.result as string;
      const encoded = imgSrc.split(',')[1] || '';
      if (!encoded.startsWith('iVBORw0KGgo')) {
        alert('The selected file does not have a PNG signature.');
        setIsLoading(false);
        return;
      }

      fabric.Image.fromURL(imgSrc)
        .then((img) => {

          const canvas = canvasRef.current;
          if (!canvas) {
            throw new Error('Canvas not available');
          }

          if (!img || !img.width || !img.height || img.width > 8192 || img.height > 8192 || img.width * img.height > 32000000) {
            throw new Error('Invalid image dimensions');
          }


          canvas.discardActiveObject();
          const objects = canvas.getObjects().slice();
          objects.forEach(obj => {
            try {
              canvas.remove(obj);
            } catch (error) {
              console.warn('Error removing object during image load:', error);
            }
          });

          const maxCanvasWidth = 800;
          const maxCanvasHeight = 600;
          const imageAspectRatio = img.width / img.height;

          let canvasWidth: number, canvasHeight: number;

          if (imageAspectRatio > maxCanvasWidth / maxCanvasHeight) {
            // Image is wider than the max canvas aspect ratio
            canvasWidth = maxCanvasWidth;
            canvasHeight = maxCanvasWidth / imageAspectRatio;
          } else {
            // Image is taller than the max canvas aspect ratio
            canvasHeight = maxCanvasHeight;
            canvasWidth = maxCanvasHeight * imageAspectRatio;
          }

          // Set canvas dimensions to calculated viewable size
          canvas.setDimensions({ width: canvasWidth, height: canvasHeight });

          // Scale the image to fit the canvas while maintaining aspect ratio
          const scaleX = canvasWidth / img.width;
          const scaleY = canvasHeight / img.height;
          const scale = Math.min(scaleX, scaleY);

          img.scaleX = scale;
          img.scaleY = scale;

          // Center the image on the canvas
          img.left = (canvasWidth - img.width * scale) / 2;
          img.top = (canvasHeight - img.height * scale) / 2;

          // Set the image as background
          (canvas as any).backgroundImage = img;
          canvas.renderAll();

          setEditorState(prev => ({
            ...prev,
            backgroundImage: imgSrc,
            canvasWidth: canvasWidth,
            canvasHeight: canvasHeight,
            textLayers: [], // Clear text layers when new image is loaded
            selectedLayerId: null,
          }));

          saveToHistory();
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Fabric image creation failed:', err);
          alert(`Failed to load image: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`);
          setIsLoading(false);
        });
    };

    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      setIsLoading(false);
      alert('Failed to read image file. Please check the file and try again.');
    };

    reader.readAsDataURL(file);
  }, [saveToHistory]);

  // Add text layer
  const addTextLayer = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const centerX = canvas.width! / 2;
    const centerY = canvas.height! / 2;

    const textObject = addTextToCanvas(canvas, {
      text: 'Your Text Here',
      left: centerX - 50,
      top: centerY - 20,
      fontFamily: 'Arial',
      fontSize: 32,
      fontWeight: 'normal',
      fill: '#000000',
      opacity: 1,
      textAlign: 'center',
    });

    (textObject as any).enterEditing?.();
    (textObject as any).selectAll?.();
    canvas.renderAll();

    (textObject as any).id = `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Ensure text is on top
    canvas.remove(textObject);
    canvas.add(textObject);
    canvas.setActiveObject(textObject as any);
    canvas.renderAll();

    setEditorState(prev => ({
      ...prev,
      selectedLayerId: (textObject as any).id!,
      textLayers: [
        ...prev.textLayers,
        {
          id: (textObject as any).id!,
          text: textObject.text || '',
          visible: true,
          locked: false,
        }
      ]
    }));

    saveToHistory();
  }, [saveToHistory]);

  // Update text properties with performance optimizations
  const updateTextProperties = useCallback((updates: Partial<{
    text: string;
    fontFamily: string;
    fontSize: number;
    fontWeight: string | number;
    fill: string;
    opacity: number;
    textAlign: string;
    rotation: 'left' | 'right';
  }>) => {
    if (!canvasRef.current || !editorState.selectedLayerId) return;

    const canvas = canvasRef.current;
    const activeObject = canvas.getActiveObject() as any;

    // Ensure we only operate on text objects, not images or other objects
    if (!activeObject || activeObject.id !== editorState.selectedLayerId || (activeObject.type !== 'text' && activeObject.type !== 'i-text')) {
      console.warn('Attempted to update properties on non-text object');
      return;
    }

    const family = (updates.fontFamily ?? activeObject.fontFamily) as string | undefined;
    const weight = (updates.fontWeight ?? activeObject.fontWeight) as string | number | undefined;

    const apply = () => {
      if (canvasRef.current !== canvas || !canvas.getObjects().includes(activeObject)) return;
      try {
        // Batch all property updates to minimize re-renders
        const allUpdates: any = {};
        let needsRender = false;

        // Handle rotation separately - only for text objects
        if (updates.rotation && (activeObject.type === 'text' || activeObject.type === 'i-text')) {
          const currentAngle = activeObject.angle || 0;
          const rotationAmount = 15; // degrees
          const newAngle = updates.rotation === 'left'
            ? currentAngle - rotationAmount
            : currentAngle + rotationAmount;

          allUpdates.angle = newAngle;
          needsRender = true;
        }

        // Handle other properties (excluding rotation)
        const otherUpdates = Object.keys(updates)
          .filter(key => key !== 'rotation')
          .reduce((acc, key) => {
            const value = updates[key as keyof typeof updates];
            if (value !== undefined) {
              acc[key] = value;
              needsRender = true;
            }
            return acc;
          }, {} as any);

        // Apply all updates at once
        if (Object.keys(allUpdates).length > 0 || Object.keys(otherUpdates).length > 0) {
          activeObject.set({
            ...allUpdates,
            ...otherUpdates,
            selectable: true,
            evented: true,
            hasControls: true,
            hasBorders: true
          });

          // Only render if we actually made changes
          if (needsRender) {
            // Batch coordinate updates
            activeObject.initDimensions?.();
            activeObject.setCoords();
            canvas.renderAll();
          }
        }

        // Debounced history save to prevent excessive saves
        if (styleSaveTimer.current) window.clearTimeout(styleSaveTimer.current);
        styleSaveTimer.current = window.setTimeout(() => {
          // Trigger object:modified event to update state
          canvas.fire('object:modified', { target: activeObject });
        }, 300) as unknown as number;
      } catch (error) {
        console.error('Error updating text properties:', error);
      }
    };

    if (family) {
      ensureFontLoaded(family, weight ?? 400).then(apply).catch(apply);
    } else {
      apply();
    }
  }, [editorState.selectedLayerId, saveToHistory]);

  // Delete selected layer
  const deleteSelectedLayer = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const activeObject = canvas.getActiveObject();

    if (activeObject) {
      const layerId = (activeObject as any).id;
      canvas.remove(activeObject);

      // Update the textLayers state to remove the deleted layer
      setEditorState(prev => ({
        ...prev,
        selectedLayerId: null,
        textLayers: prev.textLayers.filter(layer => layer.id !== layerId)
      }));

      saveToHistory();
    }
  }, [saveToHistory]);

  const restoreSnapshot = useCallback(async (snapshot: EditorSnapshot, historyIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas || restoring.current) return;
    restoring.current = true;
    clearPendingEdits();
    setIsLoading(true);
    try {
      canvas.discardActiveObject();
      await canvas.loadFromJSON(snapshot.canvasJSON);
      if (canvasRef.current !== canvas) return;
      canvas.setDimensions({ width: snapshot.document.canvasWidth, height: snapshot.document.canvasHeight });
      canvas.requestRenderAll();
      setEditorState(prev => ({ ...snapshot.document, selectedLayerId: null, history: prev.history, historyIndex }));
    } catch {
      alert('The previous canvas state could not be restored. Export the current design before continuing.');
    } finally {
      restoring.current = false;
      setIsLoading(false);
    }
  }, [clearPendingEdits]);
  const undo = useCallback(() => {
    const index = editorState.historyIndex - 1;
    if (index >= 0) void restoreSnapshot(editorState.history[index], index);
  }, [editorState.history, editorState.historyIndex, restoreSnapshot]);
  const redo = useCallback(() => {
    const index = editorState.historyIndex + 1;
    if (index < editorState.history.length) void restoreSnapshot(editorState.history[index], index);
  }, [editorState.history, editorState.historyIndex, restoreSnapshot]);

  // Export canvas
  const exportToPNG = useCallback(() => {
    if (!canvasRef.current) return null;
    return exportCanvasToPNG(canvasRef.current);
  }, []);

  // Layer management functions
  const selectLayer = useCallback((layerId: string) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const objects = canvas.getObjects();
    const targetObject = objects.find(obj => (obj as any).id === layerId);
    if (targetObject) {
      canvas.setActiveObject(targetObject);
      canvas.renderAll();
      setEditorState(prev => ({ ...prev, selectedLayerId: layerId }));
    }
  }, []);

  const reorderLayer = useCallback((fromIndex: number, toIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const object = canvas.getObjects()[fromIndex];
    if (!object) return;
    canvas.moveObjectTo(object, toIndex);
    canvas.requestRenderAll();
    saveToHistory();
  }, [saveToHistory]);

  const toggleLayerVisibility = useCallback((layerId: string) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const objects = canvas.getObjects();
    const targetObject = objects.find(obj => (obj as any).id === layerId);
    if (targetObject) {
      targetObject.visible = !targetObject.visible;
      canvas.renderAll();

      // Update the textLayers state to reflect visibility change
      setEditorState(prev => ({
        ...prev,
        textLayers: prev.textLayers.map(layer =>
          layer.id === layerId
            ? { ...layer, visible: targetObject.visible }
            : layer
        )
      }));

      saveToHistory();
    }
  }, [saveToHistory]);

  const toggleLayerLock = useCallback((layerId: string) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const objects = canvas.getObjects();
    const targetObject = objects.find(obj => (obj as any).id === layerId);
    if (targetObject) {
      targetObject.selectable = !targetObject.selectable;
      targetObject.evented = !targetObject.evented;
      canvas.renderAll();

      // Update the textLayers state to reflect lock change
      setEditorState(prev => ({
        ...prev,
        textLayers: prev.textLayers.map(layer =>
          layer.id === layerId
            ? { ...layer, locked: !targetObject.selectable }
            : layer
        )
      }));

      saveToHistory();
    }
  }, [saveToHistory]);

  const deleteLayer = useCallback((layerId: string) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const objects = canvas.getObjects();
    const targetObject = objects.find(obj => (obj as any).id === layerId);
    if (targetObject) {
      canvas.remove(targetObject);
      canvas.renderAll();

      // Update the textLayers state to remove the deleted layer
      setEditorState(prev => ({
        ...prev,
        selectedLayerId: prev.selectedLayerId === layerId ? null : prev.selectedLayerId,
        textLayers: prev.textLayers.filter(layer => layer.id !== layerId)
      }));

      saveToHistory();
    }
  }, [saveToHistory]);

  const duplicateLayer = useCallback((layerId: string) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const objects = canvas.getObjects();
    const targetObject = objects.find(obj => (obj as any).id === layerId) as fabric.Text;
    if (targetObject) {
      // Use the proper fabric.js v6 cloning method
      targetObject.clone().then((clonedObject: any) => {
        // Generate new unique ID
        clonedObject.id = `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Offset position to make it visible
        clonedObject.set({
          left: (clonedObject.left || 0) + 20,
          top: (clonedObject.top || 0) + 20,
          selectable: true,
          evented: true,
          hasControls: true,
          hasBorders: true
        });

        canvas.add(clonedObject);
        canvas.setActiveObject(clonedObject);
        canvas.renderAll();

        // Update textLayers in state
        setEditorState(prev => ({
          ...prev,
          selectedLayerId: clonedObject.id!,
          textLayers: [
            ...prev.textLayers,
            {
              id: clonedObject.id!,
              text: clonedObject.text || '',
              visible: true,
              locked: false,
            }
          ]
        }));

        saveToHistory();
      }).catch((error) => {
        console.error('Failed to duplicate layer:', error);
      });
    }
  }, [saveToHistory]);

  // Reset editor
  const reset = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    clearPendingEdits();

    // Clear selection first to avoid issues
    canvas.discardActiveObject();

    // Get all objects and dispose them properly
    const objects = canvas.getObjects().slice(); // Create a copy of the array
    objects.forEach(obj => {
      try {
        canvas.remove(obj);
        // Dispose object if it has a dispose method
        if (obj && typeof (obj as any).dispose === 'function') {
          (obj as any).dispose();
        }
      } catch (error) {
        console.warn('Error removing object:', error);
      }
    });

    // Clear any remaining objects
    try {
      canvas.clear();
    } catch (error) {
      console.warn('Error during canvas clear:', error);
    }

    // Reset canvas properties
    canvas.setDimensions({ width: 800, height: 600 });
    canvas.set('backgroundColor', '#f8f9fa');
    (canvas as any).backgroundImage = null;

    // Force render
    canvas.renderAll();

    const initialState: EditorState = {
      backgroundImage: null,
      textLayers: [],
      selectedLayerId: null,
      canvasWidth: 800,
      canvasHeight: 600,
      history: [],
      historyIndex: -1,
    };

    setEditorState(initialState);
    saveToHistory();
  }, [clearPendingEdits, saveToHistory]);

  const setBackgroundEditable = useCallback((editable: boolean) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    // Since we're using direct backgroundImage assignment, handle conversion differently
    if (editable && (canvas as any).backgroundImage) {
      // Convert background image to a regular object for editing
      const bgImg = (canvas as any).backgroundImage;
      if (bgImg) {
        // Clone the background image as a regular fabric object
        const imgClone = new fabric.Image(bgImg.getElement(), {
          left: 0,
          top: 0,
          selectable: true,
          evented: true,
          hasControls: true,
          hasBorders: true,
        });

        // Clear background and add as regular object
        (canvas as any).backgroundImage = null;
        canvas.add(imgClone);
        canvas.setActiveObject(imgClone);
        canvas.renderAll();
      }
    } else if (!editable) {
      // If making non-editable, find the image object and convert back to background
      const imageObj = canvas.getObjects().find(o => o.type === 'image');
      if (imageObj) {
        canvas.remove(imageObj);
        (canvas as any).backgroundImage = imageObj;
        canvas.discardActiveObject();
        canvas.renderAll();
      }
    }
  }, []);

  return {
    canvasRef,
    editorState,
    isLoading,
    initCanvas,
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
    setBackgroundEditable,
  };
};
