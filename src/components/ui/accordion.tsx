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
	const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file && file.type === 'image/png') {
			onImageUpload(file);
		}
		event.target.value = '';
	};

	return (
		<div className="flex items-center gap-2 p-4 bg-white border-b border-gray-200 shadow-sm">
			{/* File Operations */}
			<div className="flex items-center gap-2 border-r border-gray-200 pr-4">
				<label htmlFor="image-upload">
					<Button variant="outline" className="cursor-pointer" asChild>
						<div>
							<Upload className="w-4 h-4 mr-2" />
							Upload PNG
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

				<Button onClick={onExport} variant="outline">
					<Download className="w-4 h-4 mr-2" />
					Export
				</Button>

				<Button onClick={onReset} variant="outline" size="sm">
					<RotateCcw className="w-4 h-4 mr-2" />
					Reset
				</Button>
			</div>

			{/* Edit Operations */}
			<div className="flex items-center gap-2 border-r border-gray-200 pr-4">
				<Button onClick={onUndo} disabled={!canUndo} variant="outline" size="sm">
					<Undo className="w-4 h-4" />
				</Button>

				<Button onClick={onRedo} disabled={!canRedo} variant="outline" size="sm">
					<Redo className="w-4 h-4" />
				</Button>
			</div>

			{/* Layer Operations */}
			<div className="flex items-center gap-2 border-r border-gray-200 pr-4">
				<Button onClick={onAddText} variant="default">
					<Plus className="w-4 h-4 mr-2" />
					<Type className="w-4 h-4 mr-2" />
					Add Text
				</Button>

				{hasSelection && (
					<Button onClick={onDeleteSelected} variant="destructive" size="sm">
						<Trash2 className="w-4 h-4" />
					</Button>
				)}
			</div>

			<div className="flex-1" />

			{/* Status */}
			<div className="text-sm text-gray-500">
				Ready to edit
			</div>
		</div>
	);
};