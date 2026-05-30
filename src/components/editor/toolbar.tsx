'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Plus, Redo, RotateCcw, Trash2, Undo, Upload } from 'lucide-react';

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

const groupClass = 'flex items-center gap-2';

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
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		// Clear the input so choosing the same file again still fires onChange.
		e.target.value = '';
		if (file) onImageUpload(file);
	};

	return (
		<div role="toolbar" aria-label="Editor actions" className="flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3 sm:px-6">
			<div className={groupClass}>
				<Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
					<Upload className="mr-2 h-4 w-4" aria-hidden />
					Upload PNG
				</Button>
				<input
					ref={fileInputRef}
					id="image-upload"
					type="file"
					accept="image/png"
					onChange={handleImageUpload}
					className="hidden"
					tabIndex={-1}
				/>
				<Button variant="secondary" onClick={onExport}>
					<Download className="mr-2 h-4 w-4" aria-hidden />
					Export
				</Button>
				<Button variant="ghost" onClick={onReset}>
					<RotateCcw className="mr-2 h-4 w-4" aria-hidden />
					Reset
				</Button>
			</div>

			<div className={groupClass}>
				<Button aria-label="Undo" title="Undo (Ctrl+Z)" onClick={onUndo} disabled={!canUndo} variant="outline" size="icon">
					<Undo className="h-4 w-4" aria-hidden />
				</Button>
				<Button aria-label="Redo" title="Redo (Ctrl+Shift+Z)" onClick={onRedo} disabled={!canRedo} variant="outline" size="icon">
					<Redo className="h-4 w-4" aria-hidden />
				</Button>
			</div>

			<div className={groupClass}>
				<Button onClick={onAddText} title="Add text (Ctrl+T)">
					<Plus className="mr-2 h-4 w-4" aria-hidden />
					Add Text
				</Button>
				{hasSelection && (
					<Button aria-label="Delete selected layer" onClick={onDeleteSelected} variant="outline" size="icon" className="text-destructive hover:text-destructive">
						<Trash2 className="h-4 w-4" aria-hidden />
					</Button>
				)}
			</div>
		</div>
	);
};
