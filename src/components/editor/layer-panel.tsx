'use client';

import { memo, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Copy, Eye, EyeOff, Layers, Lock, Trash2, Unlock } from 'lucide-react';
import type { TextLayer } from '@/lib/types';
import { cn } from '@/lib/utils';

interface LayerPanelProps {
	/** Bottom-first, matching the canvas stacking order. Shown top-first. */
	layers: TextLayer[];
	selectedLayerId: string | null;
	onLayerSelect: (layerId: string) => void;
	onLayerReorder: (fromIndex: number, toIndex: number) => void;
	onLayerToggleVisibility: (layerId: string) => void;
	onLayerToggleLock: (layerId: string) => void;
	onLayerDelete: (layerId: string) => void;
	onLayerDuplicate: (layerId: string) => void;
}

const iconButton = 'h-8 w-8 text-muted-foreground hover:text-foreground';

const EmptyState = () => (
	<div className="flex flex-col items-center px-6 py-10 text-center">
		<Layers className="mb-3 h-7 w-7 text-muted-foreground" aria-hidden />
		<p className="text-sm font-medium">No layers yet</p>
		<p className="mt-1 text-xs text-muted-foreground">Add Text puts a layer in the middle of the canvas.</p>
	</div>
);

export const LayerPanel = memo(function LayerPanel({
	layers,
	selectedLayerId,
	onLayerSelect,
	onLayerReorder,
	onLayerToggleVisibility,
	onLayerToggleLock,
	onLayerDelete,
	onLayerDuplicate,
}: LayerPanelProps) {
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

	const handleDrop = useCallback((targetIndex: number) => {
		if (draggedIndex !== null && draggedIndex !== targetIndex) onLayerReorder(draggedIndex, targetIndex);
		setDraggedIndex(null);
	}, [draggedIndex, onLayerReorder]);

	if (layers.length === 0) return <EmptyState />;

	const topFirst = layers.map((layer, stackIndex) => ({ layer, stackIndex })).reverse();

	return (
		<div className="space-y-3 p-4">
			<p className="text-xs uppercase tracking-wider text-muted-foreground">
				{layers.length} layer{layers.length !== 1 ? 's' : ''}
			</p>
			<ol className="space-y-2">
				{topFirst.map(({ layer, stackIndex }) => {
					const isSelected = selectedLayerId === layer.id;
					const name = layer.text || 'Empty text';
					return (
						<li
							key={layer.id}
							draggable
							onDragStart={(e) => {
								setDraggedIndex(stackIndex);
								e.dataTransfer.effectAllowed = 'move';
							}}
							onDragOver={(e) => {
								e.preventDefault();
								e.dataTransfer.dropEffect = 'move';
							}}
							onDrop={(e) => {
								e.preventDefault();
								handleDrop(stackIndex);
							}}
							className={cn(
								'flex items-center gap-1 rounded-md border bg-card p-1.5 transition-colors',
								isSelected ? 'border-primary/70 bg-primary/10' : 'hover:bg-accent/60',
								draggedIndex === stackIndex && 'opacity-50',
								!layer.visible && 'text-muted-foreground',
							)}
						>
							<div className="flex flex-col">
								<Button
									variant="ghost"
									size="icon"
									className="h-5 w-6 text-muted-foreground hover:text-foreground"
									aria-label={`Bring "${name}" forward`}
									disabled={stackIndex === layers.length - 1}
									onClick={() => onLayerReorder(stackIndex, stackIndex + 1)}
								>
									<ChevronUp className="h-3.5 w-3.5" aria-hidden />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="h-5 w-6 text-muted-foreground hover:text-foreground"
									aria-label={`Send "${name}" backward`}
									disabled={stackIndex === 0}
									onClick={() => onLayerReorder(stackIndex, stackIndex - 1)}
								>
									<ChevronDown className="h-3.5 w-3.5" aria-hidden />
								</Button>
							</div>

							<button
								type="button"
								aria-pressed={isSelected}
								onClick={() => onLayerSelect(layer.id)}
								className="min-w-0 flex-1 rounded-sm px-1.5 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								<span className="block truncate text-sm font-medium">{name}</span>
								<span className="block whitespace-nowrap font-mono text-[11px] text-muted-foreground">Layer {stackIndex + 1}</span>
							</button>

							<Button
								variant="ghost"
								size="icon"
								className={iconButton}
								aria-label={layer.visible ? `Hide "${name}"` : `Show "${name}"`}
								onClick={() => onLayerToggleVisibility(layer.id)}
							>
								{layer.visible ? <Eye className="h-4 w-4" aria-hidden /> : <EyeOff className="h-4 w-4" aria-hidden />}
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className={iconButton}
								aria-label={layer.locked ? `Unlock "${name}"` : `Lock "${name}"`}
								onClick={() => onLayerToggleLock(layer.id)}
							>
								{layer.locked ? <Lock className="h-4 w-4" aria-hidden /> : <Unlock className="h-4 w-4" aria-hidden />}
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className={iconButton}
								aria-label={`Duplicate "${name}"`}
								onClick={() => onLayerDuplicate(layer.id)}
							>
								<Copy className="h-4 w-4" aria-hidden />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-muted-foreground hover:text-destructive"
								aria-label={`Delete "${name}"`}
								onClick={() => onLayerDelete(layer.id)}
							>
								<Trash2 className="h-4 w-4" aria-hidden />
							</Button>
						</li>
					);
				})}
			</ol>
		</div>
	);
});
