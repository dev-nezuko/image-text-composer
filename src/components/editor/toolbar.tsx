'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Type,
	Upload,
	Download,
	Undo,
	Redo,
	RotateCcw,
	Trash2,
	Plus
} from 'lucide-react';

interface ToolbarProps {
	onImageUpload: (file: File) => void;
	onAddText: () => void;
	onUndo: () => void;
	onRedo: () => void;
	onExport: () => void;
	onReset: () => void;
	onDeleteSelected: () => void;
	canUndo: boolean;
	canRedo: boolean;
	hasSelection: boolean;
}

export const Toolbar = ({
	onImageUpload,
	onAddText,
	onUndo,
	onRedo,
	onExport,
	onReset,
	onDeleteSelected,
	canUndo,
	canRedo,
	hasSelection,
}: ToolbarProps) => {


	const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

    if ((file.type !== 'image/png' && !file.name.toLowerCase().endsWith('.png')) || file.size > 8 * 1024 * 1024) {
      alert('Choose a PNG image up to 8 MiB.');
      return;
    }
		onImageUpload(file);
	};

	return (
		<div className="flex items-center gap-4 p-6">
			{/* File Operations */}
			<div className="flex items-center gap-3 border-r border-gray-600/20 pr-6">
				<label htmlFor="image-upload">
					<Button
						variant="outline"
						className="cursor-pointer bg-gray-600/10 border-gray-600/30 text-gray-300 hover:bg-gray-600/20 hover:border-gray-600/50 transition-all duration-200"
						asChild
					>
						<div>
							<Upload className="w-4 h-4 mr-2" />
							Upload Image
						</div>
					</Button>
				</label>
				<input
					id="image-upload"
					type="file"
					accept="image/png"
					onChange={handleImageUpload}
					className="hidden"
				/>

				<Button
					onClick={onExport}
					variant="outline"
					className="bg-gray-500/10 border-gray-500/30 text-gray-300 hover:bg-gray-500/20 hover:border-gray-500/50 transition-all duration-200"
				>
					<Download className="w-4 h-4 mr-2" />
					Export
				</Button>

				<Button
					onClick={onReset}
					variant="outline"
					size="sm"
					className="bg-gray-600/10 border-gray-600/30 text-gray-300 hover:bg-gray-600/20 hover:border-gray-600/50 transition-all duration-200"
				>
					<RotateCcw className="w-4 h-4 mr-2" />
					Reset
				</Button>
			</div>

			{/* Edit Operations */}
			<div className="flex items-center gap-3 border-r border-gray-600/20 pr-6">
				<Button
					aria-label="Undo" onClick={onUndo}
					disabled={!canUndo}
					variant="outline"
					size="sm"
					className={`bg-gray-700/50 border-gray-600/50 text-gray-300 hover:bg-gray-600/50 hover:border-gray-500/50 transition-all duration-200 ${!canUndo ? 'opacity-50 cursor-not-allowed' : ''}`}
				>
					<Undo className="w-4 h-4" />
				</Button>

				<Button
					aria-label="Redo" onClick={onRedo}
					disabled={!canRedo}
					variant="outline"
					size="sm"
					className={`bg-gray-700/50 border-gray-600/50 text-gray-300 hover:bg-gray-600/50 hover:border-gray-500/50 transition-all duration-200 ${!canRedo ? 'opacity-50 cursor-not-allowed' : ''}`}
				>
					<Redo className="w-4 h-4" />
				</Button>
			</div>

			{/* Layer Operations */}
			<div className="flex items-center gap-3 border-r border-gray-600/20 pr-6">
				<Button
					onClick={onAddText}
					className="bg-gradient-to-r from-gray-400 to-gray-300 text-gray-900 font-semibold hover:from-gray-300 hover:to-gray-200 transition-all duration-200 shadow-lg shadow-gray-400/25"
				>
					<Plus className="w-4 h-4 mr-2" />
					<Type className="w-4 h-4 mr-2" />
					Add Text
				</Button>

				{hasSelection && (
					<Button
						onClick={onDeleteSelected}
						variant="destructive"
						size="sm"
						className="bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30 hover:border-red-500/50 transition-all duration-200"
					>
						<Trash2 className="w-4 h-4" />
					</Button>
				)}
			</div>

			<div className="flex-1" />

			{/* Status */}
			<div className="flex items-center space-x-2">
				<div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
				<span className="text-gray-400/70 text-sm font-medium">
					Ready to create
				</span>
			</div>
		</div>
	);
};
