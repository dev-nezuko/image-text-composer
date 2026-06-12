'use client';

import { useState, memo, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy
} from 'lucide-react';

interface Layer {
  id: string;
  text: string;
  visible: boolean;
  locked: boolean;
}

interface LayerPanelProps {
  layers: Layer[];
  selectedLayerId: string | null;
  onLayerSelect: (layerId: string) => void;
  onLayerReorder: (fromIndex: number, toIndex: number) => void;
  onLayerToggleVisibility: (layerId: string) => void;
  onLayerToggleLock: (layerId: string) => void;
  onLayerDelete: (layerId: string) => void;
  onLayerDuplicate: (layerId: string) => void;
}

// Memoized layer item component
const LayerItem = memo(({
  layer,
  index,
  totalLayers,
  isSelected,
  isDragged,
  onSelect,
  onReorder,
  onToggleVisibility,
  onToggleLock,
  onDelete,
  onDuplicate,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  layer: Layer;
  index: number;
  totalLayers: number;
  isSelected: boolean;
  isDragged: boolean;
  onSelect: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
}) => {
  const moveLayer = useCallback((direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? index - 1 : index + 1;
    if (toIndex >= 0 && toIndex < totalLayers) {
      onReorder(index, toIndex);
    }
  }, [index, totalLayers, onReorder]);

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 border ${
        isSelected
          ? 'ring-2 ring-gray-400/50 bg-gray-400/10 border-gray-400/30'
          : 'bg-gray-800/30 border-gray-700/50 hover:bg-gray-700/30 hover:border-gray-600/50'
      } ${isDragged ? 'opacity-50 scale-95' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, layer.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, layer.id)}
      onClick={() => onSelect(layer.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex flex-col space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-400/60 hover:text-gray-300 hover:bg-gray-600/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveLayer('up');
                  }}
                  aria-label="Move layer up"
                  disabled={index === 0}
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-400/60 hover:text-gray-300 hover:bg-gray-600/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveLayer('down');
                  }}
                  aria-label="Move layer down"
                  disabled={index === totalLayers - 1}
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-gray-200">
                  {layer.text || 'Empty Text'}
                </p>
                <p className="text-xs text-gray-400/40">
                  Layer {totalLayers - index}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button aria-label="Hide or show layer"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-400/60 hover:text-gray-300 hover:bg-gray-600/20"
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility(layer.id);
              }}
            >
              {layer.visible ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>

            <Button aria-label="Lock or unlock layer"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-400/60 hover:text-gray-300 hover:bg-gray-600/20"
              onClick={(e) => {
                e.stopPropagation();
                onToggleLock(layer.id);
              }}
            >
              {layer.locked ? (
                <Lock className="h-4 w-4" />
              ) : (
                <Unlock className="h-4 w-4" />
              )}
            </Button>

            <Button aria-label="Duplicate layer"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-400/60 hover:text-gray-300 hover:bg-gray-600/20"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(layer.id);
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>

            <Button aria-label="Delete layer"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-400/60 hover:text-red-400 hover:bg-red-500/20"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(layer.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
LayerItem.displayName = 'LayerItem';

// Memoized empty state component
const EmptyState = memo(() => (
  <div className="p-6">
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Copy className="w-8 h-8 text-gray-400" />
      </div>
      <p className="text-gray-400/60 text-sm font-medium">No layers yet</p>
      <p className="text-gray-400/40 text-xs mt-1">Add some text to get started</p>
    </div>
  </div>
));
EmptyState.displayName = 'EmptyState';

export const LayerPanel = memo(({
  layers,
  selectedLayerId,
  onLayerSelect,
  onLayerReorder,
  onLayerToggleVisibility,
  onLayerToggleLock,
  onLayerDelete,
  onLayerDuplicate,
}: LayerPanelProps) => {
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, layerId: string) => {
    setDraggedLayerId(layerId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetLayerId: string) => {
    e.preventDefault();
    if (!draggedLayerId || draggedLayerId === targetLayerId) return;

    const draggedIndex = layers.findIndex(layer => layer.id === draggedLayerId);
    const targetIndex = layers.findIndex(layer => layer.id === targetLayerId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      onLayerReorder(draggedIndex, targetIndex);
    }
    setDraggedLayerId(null);
  }, [draggedLayerId, layers, onLayerReorder]);

  // Memoize the layer list to prevent unnecessary re-renders
  const layerList = useMemo(() => {
    if (layers.length === 0) {
      return <EmptyState />;
    }

    return (
      <div className="p-6 space-y-3">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-400/60 text-sm font-medium">
            {layers.length} layer{layers.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="space-y-2">
          {layers.map((layer, index) => (
            <LayerItem
              key={layer.id}
              layer={layer}
              index={index}
              totalLayers={layers.length}
              isSelected={selectedLayerId === layer.id}
              isDragged={draggedLayerId === layer.id}
              onSelect={onLayerSelect}
              onReorder={onLayerReorder}
              onToggleVisibility={onLayerToggleVisibility}
              onToggleLock={onLayerToggleLock}
              onDelete={onLayerDelete}
              onDuplicate={onLayerDuplicate}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          ))}
        </div>
      </div>
    );
  }, [
    layers,
    selectedLayerId,
    draggedLayerId,
    onLayerSelect,
    onLayerReorder,
    onLayerToggleVisibility,
    onLayerToggleLock,
    onLayerDelete,
    onLayerDuplicate,
    handleDragStart,
    handleDragOver,
    handleDrop,
  ]);

  return layerList;
});
