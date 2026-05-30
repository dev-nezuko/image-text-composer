'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import * as fabric from 'fabric';
import { EditorState, TextLayer } from '@/lib/types';
import { createCanvas, addTextToCanvas, exportCanvasToPNG } from '@/lib/fabric-utils';
import { ensureFontLoaded } from '@/lib/google-font';

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
  const restoring = useRef(false);
  const modificationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (styleSaveTimer.current) clearTimeout(styleSaveTimer.current);
    if (modificationTimer.current) clearTimeout(modificationTimer.current);
    void canvasRef.current?.dispose();
    canvasRef.current = null;
  }, []);

  const initCanvas = useCallback((canvasElement: HTMLCanvasElement) => {
    if (canvasRef.current) {
      canvasRef.current.dispose();
    }

    canvasRef.current = createCanvas(canvasElement);
    
    canvasRef.current.on('selection:created', (e) => {
      if (e.selected && e.selected[0]) {
        const obj = e.selected[0] as any;
        if (obj.type === 'text' || obj.type === 'i-text') {
          setEditorState(prev => ({ ...prev, selectedLayerId: obj.id || null }));
        }
      }
    });

    canvasRef.current.on('selection:cleared', () => {
      setEditorState(prev => ({ ...prev, selectedLayerId: null }));
    });


    canvasRef.current.on('object:modified', () => {
      if (modificationTimer.current) {
        clearTimeout(modificationTimer.current);
      }
      
      modificationTimer.current = setTimeout(() => {
        if (canvasRef.current) {
          const objects = canvasRef.current.getObjects();
          const textLayers = objects
            .filter(obj => obj.type === 'text' || obj.type === 'i-text')
            .map(obj => {
              if (!(obj as any).id) {
                (obj as any).id = `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              }
              return {
                id: (obj as any).id || '',
                text: (obj as any).text || '',
                visible: obj.visible !== false,
                locked: !obj.selectable || !obj.evented,
              };
            });
          
          setEditorState(prev => ({
            ...prev,
            textLayers,
          }));
        }
        
        saveToHistory();
      }, 100);
    });

    canvasRef.current.on('object:moving', (e) => {
      const obj = e.target;
      if (obj && canvasRef.current) {
        const canvas = canvasRef.current;
        const centerX = canvas.width! / 2;
        const centerY = canvas.height! / 2;
        
        if (Math.abs(obj.left! - centerX) < 20) {
          obj.left = centerX;
        }
        if (Math.abs(obj.top! - centerY) < 20) {
          obj.top = centerY;
        }
      }
    });

    saveToHistory();
  }, []);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || restoring.current) return;
    const canvasJSON = canvas.toObject(['id']) as Record<string, unknown>;
    const textLayers: TextLayer[] = canvas.getObjects()
      .filter(object => object.type === 'text' || object.type === 'i-text')
      .map(object => { const text = object as fabric.IText & { id: string };
        return { id: text.id, text: text.text, visible: text.visible, locked: !text.selectable }; });
    setEditorState(prev => {
      const { history, historyIndex, ...state } = prev;
      if (JSON.stringify(history[historyIndex]?.canvasJSON) === JSON.stringify(canvasJSON)) return prev;
      const next = [...history.slice(0, historyIndex + 1), { ...state, textLayers, canvasJSON }].slice(-MAX_HISTORY);
      return { ...prev, textLayers, history: next, historyIndex: next.length - 1 };
    });
  }, []);

  const loadImage = useCallback((file: File) => {
    if (!canvasRef.current) return;

    if (file.type !== 'image/png' || file.size > 20 * 1024 * 1024) {
      alert('Choose a PNG no larger than 20 MB.'); return;
    }
    setIsLoading(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const imgSrc = e.target?.result as string;
      
      fabric.Image.fromURL(imgSrc)
        .then((img) => {
          
          const canvas = canvasRef.current;
          if (!canvas) {
            throw new Error('Canvas not available');
          }
          
          if (!img || !img.width || !img.height || img.width * img.height > 16_000_000) {
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
            exportScale: img.width / canvasWidth,
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
    if (!activeObject || (activeObject.type !== 'text' && activeObject.type !== 'i-text')) {
      console.warn('Attempted to update properties on non-text object');
      return;
    }

    const family = (updates.fontFamily ?? activeObject.fontFamily) as string | undefined;
    const weight = (updates.fontWeight ?? activeObject.fontWeight) as string | number | undefined;

    const apply = () => {
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
          saveToHistory();
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

  const restoreHistory = useCallback(async (index: number) => {
    const canvas = canvasRef.current;
    const snapshot = editorState.history[index];
    if (!canvas || !snapshot?.canvasJSON || restoring.current) return;
    restoring.current = true;
    setIsLoading(true);
    try {
      await canvas.loadFromJSON(snapshot.canvasJSON);
      canvas.setDimensions({ width: snapshot.canvasWidth, height: snapshot.canvasHeight });
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      setEditorState(prev => ({ ...snapshot, selectedLayerId: null, history: prev.history, historyIndex: index }));
    } finally {
      restoring.current = false;
      setIsLoading(false);
    }
  }, [editorState.history]);
  const undo = useCallback(() => { if (editorState.historyIndex > 0) void restoreHistory(editorState.historyIndex - 1); }, [editorState.historyIndex, restoreHistory]);
  const redo = useCallback(() => { if (editorState.historyIndex < editorState.history.length - 1) void restoreHistory(editorState.historyIndex + 1); }, [editorState.historyIndex, editorState.history.length, restoreHistory]);

  // Export canvas
  const exportToPNG = useCallback(() => {
    if (!canvasRef.current) return null;
    return exportCanvasToPNG(canvasRef.current, editorState.exportScale || 1);
  }, [editorState.exportScale]);

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
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const objects = canvas.getObjects();
    const targetObject = objects[fromIndex];
    if (targetObject) {
      canvas.moveObjectTo(targetObject, toIndex);
      canvas.renderAll();
      saveToHistory();
    }
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
  }, [saveToHistory]);

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