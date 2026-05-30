'use client';

import { useState } from 'react';
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

export const LayerPanel = ({
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

  const handleDragStart = (e: React.DragEvent, layerId: string) => {
    setDraggedLayerId(layerId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetLayerId: string) => {
    e.preventDefault();
    if (!draggedLayerId || draggedLayerId === targetLayerId) return;

    const draggedIndex = layers.findIndex(layer => layer.id === draggedLayerId);
    const targetIndex = layers.findIndex(layer => layer.id === targetLayerId);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      onLayerReorder(draggedIndex, targetIndex);
    }
    setDraggedLayerId(null);
  };

  const moveLayer = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex >= 0 && toIndex < layers.length) {
      onLayerReorder(fromIndex, toIndex);
    }
  };

  if (layers.length === 0) {
    return (
      <div className="w-80 shrink-0 bg-white border-r border-gray-200 p-4">
        <h3 className="font-semibold text-lg mb-4">Layers</h3>
        <div className="text-center text-gray-500 py-8">
          No layers yet. Add some text to get started.
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 shrink-0 bg-white border-r border-gray-200 p-4 overflow-y-auto">
      <h3 className="font-semibold text-lg mb-4">Layers ({layers.length})</h3>
      
      <div className="space-y-2">
        {layers.map((layer, index) => (
          <Card
            key={layer.id}
            className={`cursor-pointer transition-all ${
              selectedLayerId === layer.id 
                ? 'ring-2 ring-blue-500 bg-blue-50' 
                : 'hover:bg-gray-50'
            } ${draggedLayerId === layer.id ? 'opacity-50' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, layer.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, layer.id)}
            onClick={() => onLayerSelect(layer.id)}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveLayer(index, 'up');
                        }}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveLayer(index, 'down');
                        }}
                        disabled={index === layers.length - 1}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {layer.text || 'Empty Text'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Layer {layers.length - index}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLayerToggleVisibility(layer.id);
                    }}
                  >
                    {layer.visible ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLayerToggleLock(layer.id);
                    }}
                  >
                    {layer.locked ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <Unlock className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLayerDuplicate(layer.id);
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLayerDelete(layer.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}; 