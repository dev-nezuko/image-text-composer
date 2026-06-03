'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useEditor } from '../hooks/use-editor';
import { Toolbar } from '@/components/editor/toolbar';
import { CanvasContainer } from '@/components/editor/canvas-container';
import { PropertiesPanel } from '@/components/editor/properties-panel';
import { LayerPanel } from '@/components/editor/layer-panel';
import * as fabric from 'fabric';

export default function HomePage() {
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

	const getSelectedObjectData = useCallback(() => {
		if (canvasRef.current) {
			const canvas = canvasRef.current;
			const activeObject = canvas.getActiveObject();

			if (activeObject && (activeObject.type === 'text' || activeObject.type === 'i-text')) {
				const t = activeObject as any;
				return {
					text: t.text ?? '',
					fontFamily: t.fontFamily,
					fontSize: t.fontSize,
					fontWeight: t.fontWeight,
					fill: t.fill,
					opacity: t.opacity,
					textAlign: t.textAlign,
				};
			}
		}
		return null;
	}, []);

	useEffect(() => {
		const timeoutId = setTimeout(() => {
			const data = getSelectedObjectData();
			setSelectedObjectData(data);
		}, 50);

		return () => clearTimeout(timeoutId);
	}, [editorState.selectedLayerId, getSelectedObjectData]);

	useEffect(() => {
		localStorage.removeItem('image-editor-state');
		const handleKeyDown = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement | null;
			const isFormElement =
				!!target &&
				(['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable);

			const activeObj = canvasRef.current?.getActiveObject() as any;
			const isITextEditing =
				!!activeObj &&
				(activeObj.type === 'i-text' || activeObj.type === 'text') &&
				activeObj.isEditing;

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
						
						canvas.renderAll();
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

	const handleUpdateText = useCallback((updates: Partial<{
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
	}, [updateTextProperties]);

	return (
		<div className="h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
			{/* Top Navigation Bar */}
			<div className="bg-black/20 backdrop-blur-xl border-b border-gray-600/20 px-8 py-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-4">
						<div className="w-10 h-10 bg-gradient-to-r from-gray-400 to-gray-300 rounded-xl flex items-center justify-center">
							<span className="text-gray-900 font-bold text-lg">A</span>
						</div>
						<div>
							<h1 className="text-2xl font-bold bg-gradient-to-r from-gray-300 to-gray-100 bg-clip-text text-transparent">
								Adomate Studio
							</h1>
							<p className="text-gray-400/70 text-sm font-medium">
								Creative Design Platform
							</p>
						</div>
					</div>
					<div className="flex items-center space-x-6">
						<div className="bg-gray-600/10 border border-gray-600/20 rounded-lg px-4 py-2">
							<span className="text-gray-300 text-sm font-medium">
								History: {editorState.historyIndex + 1} / {editorState.history.length}
							</span>
						</div>
						<div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
					</div>
				</div>
			</div>

			{/* Toolbar */}
			<div className="bg-black/10 backdrop-blur-sm border-b border-gray-600/10">
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

			{/* Main Content Area */}
			<div className="flex-1 flex overflow-hidden">
				{/* Left Sidebar - Layer Panel */}
				<div className="w-80 bg-black/20 backdrop-blur-sm border-r border-gray-600/20 flex flex-col">
					<div className="p-6 border-b border-gray-600/10">
						<h2 className="text-lg font-semibold text-gray-200 mb-2">Layers</h2>
						<p className="text-gray-400/60 text-sm">Manage your design elements</p>
					</div>
					<div className="flex-1 overflow-y-auto">
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
					</div>
				</div>

				{/* Center Canvas Area */}
				<div className="flex-1 relative overflow-hidden">
					<div className="absolute inset-0 bg-gradient-to-br from-gray-800/50 to-gray-700/30"></div>
					<div className="relative h-full flex items-center justify-center p-8">
						<div className="bg-white/5 backdrop-blur-sm border border-gray-600/20 rounded-2xl p-6 shadow-2xl">
							<CanvasContainer
								onCanvasReady={initCanvas}
								width={editorState.canvasWidth}
								height={editorState.canvasHeight}
							/>
						</div>
					</div>
				</div>

				{/* Right Sidebar - Properties Panel */}
				<div className="w-96 bg-black/20 backdrop-blur-sm border-l border-gray-600/20 flex flex-col">
					<div className="p-6 border-b border-gray-600/10">
						<h2 className="text-lg font-semibold text-gray-200 mb-2">Properties</h2>
						<p className="text-gray-400/60 text-sm">Customize your selections</p>
					</div>
					<div className="flex-1 overflow-y-auto">
						<PropertiesPanel
							selectedObjectData={selectedObjectData}
							onUpdateText={handleUpdateText}
						/>
					</div>
				</div>
			</div>

			{/* Loading Overlay */}
			{isLoading && (
				<div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
					<div className="bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600/20 p-8 rounded-2xl shadow-2xl">
						<div className="flex items-center space-x-4">
							<div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
							<div>
								<p className="text-gray-200 font-medium">Processing Image</p>
								<p className="text-gray-400/60 text-sm">Please wait...</p>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}