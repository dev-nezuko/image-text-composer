'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { HexColorPicker } from 'react-colorful';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { loadGoogleFonts, loadFont } from '@/lib/google-font';
import { GoogleFont } from '@/lib/types';
import { Palette, AlignLeft, AlignCenter, AlignRight, RotateCcw, RotateCw } from 'lucide-react';

interface PropertiesPanelProps {
	selectedObjectData?: {
		text: string;
		fontFamily: string;
		fontSize: number;
		fontWeight: string | number; // allow both
		fill: string;
		opacity: number;
		textAlign: string;
	};
	onUpdateText: (updates: any) => void;
}

const FONT_WEIGHTS = [
	{ value: 'normal', label: 'Normal' },
	{ value: 'bold', label: 'Bold' },
	{ value: '100', label: 'Thin' },
	{ value: '200', label: 'Extra Light' },
	{ value: '300', label: 'Light' },
	{ value: '400', label: 'Regular' },
	{ value: '500', label: 'Medium' },
	{ value: '600', label: 'Semi Bold' },
	{ value: '700', label: 'Bold' },
	{ value: '800', label: 'Extra Bold' },
	{ value: '900', label: 'Black' },
];

export const PropertiesPanel = ({ selectedObjectData, onUpdateText }: PropertiesPanelProps) => {
	const [fonts, setFonts] = useState<GoogleFont[]>([]);
	const [fontsLoading, setFontsLoading] = useState(true);
	const [color, setColor] = useState('#000000');

	useEffect(() => {
		loadGoogleFonts().then((loadedFonts: GoogleFont[]) => {
			setFonts(loadedFonts);
			setFontsLoading(false);
		});
	}, []);

	useEffect(() => {
		if (selectedObjectData?.fill) {
			setColor(selectedObjectData.fill);
		}
	}, [selectedObjectData?.fill]);

	if (!selectedObjectData) {
		return (
			<div className="w-80 bg-white border-l border-gray-200 p-4">
				<div className="text-center text-gray-500 py-8">
					Select a text layer to edit its properties
				</div>
			</div>
		);
	}

	const handleFontChange = async (fontFamily: string) => {
		await loadFont(fontFamily);
		onUpdateText({ fontFamily });
	};

	const handleColorChange = (newColor: string) => {
		setColor(newColor);
		onUpdateText({ fill: newColor });
	};

	return (
		<div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
			<h3 className="font-semibold text-lg mb-4">Text Properties</h3>

			<div className="space-y-6">
				{/* Text Content */}
				<div>
					<Label htmlFor="text-content">Content</Label>
					<Textarea
						id="text-content"
						value={selectedObjectData.text}
						onChange={(e) => onUpdateText({ text: e.target.value })}
						className="mt-1 resize-none"
						rows={3}
					/>
				</div>

				{/* Font Family */}
				<div>
					<Label>Font Family</Label>
					<Select value={selectedObjectData.fontFamily} onValueChange={handleFontChange}>
						<SelectTrigger className="mt-1">
							<SelectValue placeholder="Select font..." />
						</SelectTrigger>
						<SelectContent className="max-h-60">
							{fontsLoading ? (
								<SelectItem value="loading" disabled>Loading fonts...</SelectItem>
							) : (
								fonts.map((font) => (
									<SelectItem key={font.family} value={font.family}>
										<span style={{ fontFamily: font.family }}>{font.family}</span>
									</SelectItem>
								))
							)}
						</SelectContent>
					</Select>
				</div>

				{/* Font Size */}
				<div>
					<Label>Font Size</Label>
					<div className="flex items-center gap-2 mt-1">
						<Slider
							value={[selectedObjectData.fontSize]}
							onValueChange={([value]) => onUpdateText({ fontSize: value })}
							max={200}
							min={8}
							step={1}
							className="flex-1"
						/>
						<Input
							type="number"
							value={selectedObjectData.fontSize}
							onChange={(e) => onUpdateText({ fontSize: parseInt(e.target.value) })}
							className="w-16"
							min={8}
							max={200}
						/>
					</div>
				</div>

				{/* Font Weight */}
				<div>
					<Label>Font Weight</Label>
					<Select value={String(selectedObjectData.fontWeight ?? '')} onValueChange={(value) => onUpdateText({ fontWeight: value })}>
						<SelectTrigger className="mt-1">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{FONT_WEIGHTS.map((weight) => (
								<SelectItem key={weight.value} value={weight.value}>
									{weight.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Text Color */}
				<div>
					<Label>Color</Label>
					<div className="mt-1">
						<Popover>
							<PopoverTrigger asChild>
								<Button variant="outline" className="w-full justify-start gap-2">
									<div
										className="w-4 h-4 rounded border border-gray-300"
										style={{ backgroundColor: color }}
									/>
									<Palette className="w-4 h-4" />
									{color.toUpperCase()}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-3" align="start">
								<HexColorPicker color={color} onChange={handleColorChange} />
							</PopoverContent>
						</Popover>
					</div>
				</div>

				{/* Opacity */}
				<div>
					<Label>Opacity</Label>
					<div className="flex items-center gap-2 mt-1">
						<Slider
							value={[selectedObjectData.opacity * 100]}
							onValueChange={([value]) => onUpdateText({ opacity: value / 100 })}
							max={100}
							min={0}
							step={1}
							className="flex-1"
						/>
						<span className="text-sm text-gray-500 w-12">
							{Math.round(selectedObjectData.opacity * 100)}%
						</span>
					</div>
				</div>

				{/* Text Alignment */}
				<div>
					<Label>Alignment</Label>
					<div className="flex gap-1 mt-1">
						<Button
							variant={selectedObjectData.textAlign === 'left' ? 'default' : 'outline'}
							size="sm"
							onClick={() => onUpdateText({ textAlign: 'left' })}
						>
							<AlignLeft className="w-4 h-4" />
						</Button>
						<Button
							variant={selectedObjectData.textAlign === 'center' ? 'default' : 'outline'}
							size="sm"
							onClick={() => onUpdateText({ textAlign: 'center' })}
						>
							<AlignCenter className="w-4 h-4" />
						</Button>
						<Button
							variant={selectedObjectData.textAlign === 'right' ? 'default' : 'outline'}
							size="sm"
							onClick={() => onUpdateText({ textAlign: 'right' })}
						>
							<AlignRight className="w-4 h-4" />
						</Button>
					</div>
				</div>

				{/* Rotation */}
				<div>
					<Label>Rotation</Label>
					<div className="flex gap-1 mt-1">
						<Button
							variant="outline"
							size="sm"
							onClick={() => onUpdateText({ rotation: 'left' })}
							title="Rotate left 15°"
						>
							<RotateCcw className="w-4 h-4" />
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => onUpdateText({ rotation: 'right' })}
							title="Rotate right 15°"
						>
							<RotateCw className="w-4 h-4" />
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};