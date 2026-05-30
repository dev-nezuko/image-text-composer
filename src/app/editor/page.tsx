'use client';

import { useEffect, useState } from 'react';
import { useEditor } from '../../hooks/use-editor';
import { Toolbar } from '@/components/editor/toolbar';
import { CanvasContainer } from '@/components/editor/canvas-container';
import { PropertiesPanel } from '@/components/editor/properties-panel';
import { LayerPanel } from '@/components/editor/layer-panel';
import * as fabric from 'fabric';

export default function EditorPage() {
	const {
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
	} = useEditor();

	const [selectedObjectData, setSelectedObjectData] = useState<any>(null);

	// Update selected object data when selection changes
	useEffect(() => {
		if (canvasRef.current) {
			const canvas = canvasRef.current;
			const activeObject = canvas.getActiveObject();

			if (activeObject && (activeObject.type === 'text' || activeObject.type === 'i-text')) {
				const t = activeObject as any;
				setSelectedObjectData({
					text: t.text ?? '',
					fontFamily: t.fontFamily,
					fontSize: t.fontSize,
					fontWeight: t.fontWeight,
					fill: t.fill,
					opacity: t.opacity,
					textAlign: t.textAlign,
				});
			} else {
				setSelectedObjectData(null);
			}
		} else {
			setSelectedObjectData(null);
		}
	}, [editorState.selectedLayerId]);

	// Handle keyboard shortcuts
	useEffect(() => {
		localStorage.removeItem('image-editor-state');
		const handleKeyDown = (e: KeyboardEvent) => {
			// 1) Skip when typing in inputs/textareas/contentEditable
			const target = e.target as HTMLElement | null;
			const isFormElement =
				!!target &&
				(['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable);

			// 2) Skip when an IText/Text is currently in edit mode
			const activeObj = canvasRef.current?.getActiveObject() as any;
			const isITextEditing =
				!!activeObj &&
				(activeObj.type === 'i-text' || activeObj.type === 'text') &&
				activeObj.isEditing;

			if (isFormElement || isITextEditing) {
				return; // let the user edit text normally
			}

			// existing shortcuts below...
			if (e.ctrlKey || e.metaKey) {
				switch (e.key) {
					case 'z':
						e.preventDefault();
						if (e.shiftKey) {
							redo();
						} else {
							undo();
						}
						break;
					case 'y':
						e.preventDefault();
						redo();
						break;
					case 't':
						e.preventDefault();
						addTextLayer();
						break;
				}
			}

			if (e.key === 'Delete' || e.key === 'Backspace') {
				if (editorState.selectedLayerId) {
					deleteSelectedLayer();
				}
			}

			// Arrow key nudge for precise positioning
			if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
				if (editorState.selectedLayerId && canvasRef.current) {
					e.preventDefault();
					const canvas = canvasRef.current;
					const activeObject = canvas.getActiveObject();
					
					if (activeObject) {
						const nudgeAmount = e.shiftKey ? 10 : 1; // Shift + arrow = 10px, arrow = 1px
						
						switch (e.key) {
							case 'ArrowUp':
								activeObject.top = (activeObject.top || 0) - nudgeAmount;
								break;
							case 'ArrowDown':
								activeObject.top = (activeObject.top || 0) + nudgeAmount;
								break;
							case 'ArrowLeft':
								activeObject.left = (activeObject.left || 0) - nudgeAmount;
								break;
							case 'ArrowRight':
								activeObject.left = (activeObject.left || 0) + nudgeAmount;
								break;
						}
						
						canvas.renderAll();
						// Note: saveToHistory is called automatically on object:modified
					}
				}
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [undo, redo, addTextLayer, deleteSelectedLayer, editorState.selectedLayerId]);

	const handleExport = () => {
		const dataURL = exportToPNG();
		if (dataURL) {
			const link = document.createElement('a');
			link.download = 'design.png';
			link.href = dataURL;
			link.click();
		}
	};

	const canUndo = editorState.historyIndex > 0;
	const canRedo = editorState.historyIndex < editorState.history.length - 1;

	const handleUpdateText = (updates: Partial<{
		text: string;
		fontFamily: string;
		fontSize: number;
		fontWeight: string;
		fill: string;
		opacity: number;
		textAlign: string;
		rotation: 'left' | 'right';
	}>) => {
		updateTextProperties(updates);              // updates Fabric object
		
		// Only update selectedObjectData with display properties (not rotation commands)
		const displayUpdates = Object.keys(updates)
			.filter(key => key !== 'rotation')
			.reduce((acc, key) => {
				acc[key] = updates[key as keyof typeof updates];
				return acc;
			}, {} as any);
			
		if (Object.keys(displayUpdates).length > 0) {
			setSelectedObjectData((prev: typeof selectedObjectData) =>
				prev ? { ...prev, ...displayUpdates } : prev    // instantly reflect in UI
			);
		}
	};

	return (
		<div className="h-screen flex flex-col bg-gray-50">
			{/* Header */}
			<div className="bg-white border-b border-gray-200 px-6 py-4">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold text-gray-900">Image Text Editor</h1>
						<p className="text-sm text-gray-500">
							Upload a PNG image and add beautiful text overlays
						</p>
					</div>
					<div className="text-sm text-gray-500">
						History: {editorState.historyIndex + 1} / {editorState.history.length}
					</div>
				</div>
			</div>

			{/* Toolbar */}
			<Toolbar
				onImageUpload={loadImage}
				onAddText={addTextLayer}
				onUndo={undo}
				onRedo={redo}
				onExport={handleExport}
				onReset={reset}
				onDeleteSelected={deleteSelectedLayer}
				canUndo={canUndo}
				canRedo={canRedo}
				hasSelection={!!editorState.selectedLayerId}
			/>

			{/* Main Content */}
			<div className="flex-1 flex overflow-hidden relative">
				{/* Layer Panel (left) */}
				<LayerPanel
					layers={editorState.textLayers}
					selectedLayerId={editorState.selectedLayerId}
					onLayerSelect={selectLayer}
					onLayerReorder={reorderLayer}
					onLayerToggleVisibility={toggleLayerVisibility}
					onLayerToggleLock={toggleLayerLock}
					onLayerDelete={deleteLayer}
					onLayerDuplicate={duplicateLayer}
				/>

				{/* Canvas Area (center) */}
				<div className="flex-1 min-w-0 overflow-auto bg-gray-50 p-4 z-0">
					<div className="grid place-items-center min-h-full">
						<CanvasContainer
							onCanvasReady={initCanvas}
							width={editorState.canvasWidth}
							height={editorState.canvasHeight}
						/>
					</div>
				</div>

				{/* Properties Panel (right) */}
				<div className="w-80 shrink-0 border-l border-gray-200 bg-white overflow-y-auto z-10">
					<PropertiesPanel
						selectedObjectData={selectedObjectData}
						onUpdateText={handleUpdateText}
					/>
				</div>
			</div>

			{/* Loading Overlay */}
			{isLoading && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white p-6 rounded-lg shadow-xl">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
						<p className="text-gray-600">Loading image...</p>
					</div>
				</div>
			)}
		</div>
	);
}