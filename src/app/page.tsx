'use client';

import { useEffect, useState, useCallback } from 'react';
import { useEditor } from '@/hooks/use-editor';
import { Toolbar } from '@/components/editor/toolbar';
import { CanvasContainer } from '@/components/editor/canvas-container';
import { PropertiesPanel } from '@/components/editor/properties-panel';
import { LayerPanel } from '@/components/editor/layer-panel';
import { isTextObject } from '@/lib/fabric-utils';
import type { SelectedText, TextStyleUpdate } from '@/lib/types';

export default function HomePage() {
	const {
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
	} = useEditor();

	const [selectedObjectData, setSelectedObjectData] = useState<SelectedText | null>(null);

	const getSelectedObjectData = useCallback((): SelectedText | null => {
		const active = canvasRef.current?.getActiveObject();
		if (!isTextObject(active)) return null;
		return {
			id: active.id ?? '',
			text: active.text ?? '',
			fontFamily: active.fontFamily,
			fontSize: active.fontSize,
			fontWeight: active.fontWeight,
			fill: typeof active.fill === 'string' ? active.fill : '#000000',
			opacity: active.opacity,
			textAlign: active.textAlign,
		};
	}, [canvasRef]);

	useEffect(() => {
		setSelectedObjectData(getSelectedObjectData());
	}, [editorState.selectedLayerId, getSelectedObjectData]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement | null;
			const isFormElement =
				!!target &&
				(['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable);

			const activeObj = canvasRef.current?.getActiveObject();
			const isITextEditing = isTextObject(activeObj) && activeObj.isEditing;

			if (isFormElement || isITextEditing) {
				return;
			}
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
				}
			}

			if (e.key === 'Delete' || e.key === 'Backspace') {
				if (editorState.selectedLayerId) {
					deleteSelectedLayer();
				}
			}

			if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
				if (editorState.selectedLayerId && canvasRef.current) {
					e.preventDefault();
					const canvas = canvasRef.current;
					const activeObject = canvas.getActiveObject();
					
					if (activeObject) {
						const nudgeAmount = e.shiftKey ? 10 : 1;
						
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
						
						// Fabric hit-tests against cached corner coordinates; refresh them.
						activeObject.setCoords();
						canvas.requestRenderAll();
						canvas.fire('object:modified', { target: activeObject });
					}
				}
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [canvasRef, undo, redo, deleteSelectedLayer, editorState.selectedLayerId]);

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

	const handleUpdateText = useCallback((updates: TextStyleUpdate) => {
		updateTextProperties(updates);
		const displayUpdates = { ...updates };
		delete displayUpdates.rotation;
		if (Object.keys(displayUpdates).length > 0) {
			setSelectedObjectData(prev => (prev ? { ...prev, ...displayUpdates } : prev));
		}
	}, [updateTextProperties]);

	const hasImage = editorState.backgroundImage !== null;
	const panelHeading = 'border-b px-4 py-3 text-sm font-semibold';

	return (
		<div className="flex min-h-screen flex-col lg:h-screen">
			<header className="flex items-center justify-between gap-4 border-b px-4 py-3 sm:px-6">
				<div className="flex items-baseline gap-3">
					<h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">Image Text Editor</h1>
					<p className="hidden text-sm text-muted-foreground sm:block">Text over PNGs, exported at full size</p>
				</div>
				<p className="font-mono text-xs text-muted-foreground" aria-live="polite">
					Step {editorState.historyIndex + 1} of {editorState.history.length}
				</p>
			</header>

			<div className="border-b bg-card/60">
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
			</div>

			{error && (
				<div role="alert" className="flex items-center justify-between gap-4 border-b border-destructive/40 bg-destructive/10 px-4 py-2 text-sm sm:px-6">
					<span>{error}</span>
					<button type="button" onClick={dismissError} className="rounded-sm px-2 py-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
						Dismiss
					</button>
				</div>
			)}

			<main className="flex flex-1 flex-col lg:grid lg:min-h-0 lg:grid-cols-[20rem_minmax(0,1fr)_19rem]">
				<section aria-labelledby="canvas-heading" className="order-1 h-[50svh] p-4 lg:order-2 lg:h-auto lg:min-h-0 lg:p-6">
					<h2 id="canvas-heading" className="sr-only">Canvas</h2>
					<CanvasContainer onCanvasReady={initCanvas} onViewportResize={fitToViewport} hasImage={hasImage} />
				</section>

				<section aria-labelledby="layers-heading" className="order-2 border-t lg:order-1 lg:min-h-0 lg:overflow-y-auto lg:border-r lg:border-t-0">
					<h2 id="layers-heading" className={panelHeading}>Layers</h2>
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
				</section>

				<section aria-labelledby="properties-heading" className="order-3 border-t lg:min-h-0 lg:overflow-y-auto lg:border-l lg:border-t-0">
					<h2 id="properties-heading" className={panelHeading}>Properties</h2>
					<PropertiesPanel selectedObjectData={selectedObjectData} onUpdateText={handleUpdateText} />
				</section>
			</main>

			{isLoading && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70" role="status" aria-live="polite">
					<div className="flex items-center gap-3 rounded-md border bg-card px-5 py-4 shadow-lg">
						<div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden />
						<p className="text-sm">Processing image…</p>
					</div>
				</div>
			)}
		</div>
	);
}
