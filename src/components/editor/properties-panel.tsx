'use client';

import { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
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
import { Palette, AlignLeft, AlignCenter, AlignRight, RotateCcw, RotateCw, Type } from 'lucide-react';

interface PropertiesPanelProps {
	selectedObjectData?: {
		text: string;
		fontFamily: string;
		fontSize: number;
		fontWeight: string | number;
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

const useFonts = () => {
	const [fonts, setFonts] = useState<GoogleFont[]>([]);
	const [fontsLoading, setFontsLoading] = useState(true);

	useEffect(() => {
		let mounted = true;
		
		loadGoogleFonts().then((loadedFonts: GoogleFont[]) => {
			if (mounted) {
				setFonts(loadedFonts);
				setFontsLoading(false);
			}
		}).catch(() => {
			if (mounted) {
				setFontsLoading(false);
			}
		});

		return () => {
			mounted = false;
		};
	}, []);

	return { fonts, fontsLoading };
};

const useDebouncedUpdate = (callback: (updates: any) => void, delay: number = 100) => {
	const timeoutRef = useRef<NodeJS.Timeout>();

	return useCallback((updates: any) => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}
		
		timeoutRef.current = setTimeout(() => {
			callback(updates);
		}, delay);
	}, [callback, delay]);
};

const TextContentSection = memo(({ 
	text, 
	onUpdate 
}: { 
	text: string; 
	onUpdate: (updates: any) => void; 
}) => {
	const debouncedUpdate = useDebouncedUpdate(onUpdate, 300);

	return (
		<div className="space-y-2">
			<Label htmlFor="text-content" className="text-gray-200 text-sm font-medium">Content</Label>
			<Textarea
				id="text-content"
				defaultValue={text}
				onChange={(e) => debouncedUpdate({ text: e.target.value })}
				className="resize-none bg-gray-800/50 border-gray-700/50 text-gray-200 placeholder-gray-400/40 focus:border-gray-500/50 focus:ring-gray-500/20"
				rows={3}
				placeholder="Enter your text here..."
			/>
		</div>
	);
});
TextContentSection.displayName = 'TextContentSection';

const FontFamilySection = memo(({ 
	fontFamily, 
	fonts, 
	fontsLoading, 
	onUpdate 
}: { 
	fontFamily: string; 
	fonts: GoogleFont[]; 
	fontsLoading: boolean; 
	onUpdate: (updates: any) => void; 
}) => {
	const handleFontChange = useCallback(async (newFontFamily: string) => {
		await loadFont(newFontFamily);
		onUpdate({ fontFamily: newFontFamily });
	}, [onUpdate]);

	return (
		<div className="space-y-2">
			<Label className="text-gray-200 text-sm font-medium">Font Family</Label>
			<Select value={fontFamily} onValueChange={handleFontChange}>
				<SelectTrigger className="bg-gray-800/50 border-gray-700/50 text-gray-200 focus:border-gray-500/50 focus:ring-gray-500/20">
					<SelectValue placeholder="Select font..." />
				</SelectTrigger>
				<SelectContent className="max-h-60 bg-gray-800 border-gray-700">
					{fontsLoading ? (
						<SelectItem value="loading" disabled className="text-gray-400/60">Loading fonts...</SelectItem>
					) : (
						fonts.map((font) => (
							<SelectItem key={font.family} value={font.family} className="text-gray-200 hover:bg-gray-700">
								<span style={{ fontFamily: font.family }}>{font.family}</span>
							</SelectItem>
						))
					)}
				</SelectContent>
			</Select>
		</div>
	);
});
FontFamilySection.displayName = 'FontFamilySection';

const FontSizeSection = memo(({ 
	fontSize, 
	onUpdate 
}: { 
	fontSize: number; 
	onUpdate: (updates: any) => void; 
}) => {
	const debouncedUpdate = useDebouncedUpdate(onUpdate, 100);

	return (
		<div className="space-y-2">
			<Label className="text-gray-200 text-sm font-medium">Font Size</Label>
			<div className="flex items-center gap-3">
				<Slider
					value={[fontSize]}
					onValueChange={([value]) => debouncedUpdate({ fontSize: value })}
					max={200}
					min={8}
					step={1}
					className="flex-1"
				/>
				<Input
					type="number"
					defaultValue={fontSize}
					onChange={(e) => debouncedUpdate({ fontSize: parseInt(e.target.value) || 8 })}
					className="w-16 bg-gray-800/50 border-gray-700/50 text-gray-200 focus:border-gray-500/50 focus:ring-gray-500/20"
					min={8}
					max={200}
				/>
			</div>
		</div>
	);
});
FontSizeSection.displayName = 'FontSizeSection';

const FontWeightSection = memo(({ 
	fontWeight, 
	onUpdate 
}: { 
	fontWeight: string | number; 
	onUpdate: (updates: any) => void; 
}) => {
	return (
		<div className="space-y-2">
			<Label className="text-gray-200 text-sm font-medium">Font Weight</Label>
			<Select value={String(fontWeight ?? '')} onValueChange={(value) => onUpdate({ fontWeight: value })}>
				<SelectTrigger className="bg-gray-800/50 border-gray-700/50 text-gray-200 focus:border-gray-500/50 focus:ring-gray-500/20">
					<SelectValue />
				</SelectTrigger>
				<SelectContent className="bg-gray-800 border-gray-700">
					{FONT_WEIGHTS.map((weight) => (
						<SelectItem key={weight.value} value={weight.value} className="text-gray-200 hover:bg-gray-700">
							{weight.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
});
FontWeightSection.displayName = 'FontWeightSection';

const ColorSection = memo(({ 
	fill, 
	onUpdate 
}: { 
	fill: string; 
	onUpdate: (updates: any) => void; 
}) => {
	const [color, setColor] = useState(fill);

	useEffect(() => {
		setColor(fill);
	}, [fill]);

	const handleColorChange = useCallback((newColor: string) => {
		setColor(newColor);
		onUpdate({ fill: newColor });
	}, [onUpdate]);

	return (
		<div className="space-y-2">
			<Label className="text-gray-200 text-sm font-medium">Color</Label>
			<Popover>
				<PopoverTrigger asChild>
					<Button 
						variant="outline" 
						className="w-full justify-start gap-3 bg-gray-800/50 border-gray-700/50 text-gray-200 hover:bg-gray-700/50 hover:border-gray-600/50"
					>
						<div
							className="w-4 h-4 rounded border border-gray-600"
							style={{ backgroundColor: color }}
						/>
						<Palette className="w-4 h-4" />
						{color.toUpperCase()}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-3 bg-gray-800 border-gray-700" align="start">
					<HexColorPicker color={color} onChange={handleColorChange} />
				</PopoverContent>
			</Popover>
		</div>
	);
});
ColorSection.displayName = 'ColorSection';

const OpacitySection = memo(({ 
	opacity, 
	onUpdate 
}: { 
	opacity: number; 
	onUpdate: (updates: any) => void; 
}) => {
	const debouncedUpdate = useDebouncedUpdate(onUpdate, 100);

	return (
		<div className="space-y-2">
			<Label className="text-gray-200 text-sm font-medium">Opacity</Label>
			<div className="flex items-center gap-3">
				<Slider
					value={[opacity * 100]}
					onValueChange={([value]) => debouncedUpdate({ opacity: value / 100 })}
					max={100}
					min={0}
					step={1}
					className="flex-1"
				/>
				<span className="text-sm text-gray-400/60 w-12">
					{Math.round(opacity * 100)}%
				</span>
			</div>
		</div>
	);
});
OpacitySection.displayName = 'OpacitySection';

const AlignmentSection = memo(({ 
	textAlign, 
	onUpdate 
}: { 
	textAlign: string; 
	onUpdate: (updates: any) => void; 
}) => {
	return (
		<div className="space-y-2">
			<Label className="text-gray-200 text-sm font-medium">Alignment</Label>
			<div className="flex gap-2">
				<Button
					variant={textAlign === 'left' ? 'default' : 'outline'}
					size="sm"
					onClick={() => onUpdate({ textAlign: 'left' })}
					className={textAlign === 'left' 
						? 'bg-gray-400 text-gray-900 hover:bg-gray-300' 
						: 'bg-gray-800/50 border-gray-700/50 text-gray-200 hover:bg-gray-700/50 hover:border-gray-600/50'
					}
				>
					<AlignLeft className="w-4 h-4" />
				</Button>
				<Button
					variant={textAlign === 'center' ? 'default' : 'outline'}
					size="sm"
					onClick={() => onUpdate({ textAlign: 'center' })}
					className={textAlign === 'center' 
						? 'bg-gray-400 text-gray-900 hover:bg-gray-300' 
						: 'bg-gray-800/50 border-gray-700/50 text-gray-200 hover:bg-gray-700/50 hover:border-gray-600/50'
					}
				>
					<AlignCenter className="w-4 h-4" />
				</Button>
				<Button
					variant={textAlign === 'right' ? 'default' : 'outline'}
					size="sm"
					onClick={() => onUpdate({ textAlign: 'right' })}
					className={textAlign === 'right' 
						? 'bg-gray-400 text-gray-900 hover:bg-gray-300' 
						: 'bg-gray-800/50 border-gray-700/50 text-gray-200 hover:bg-gray-700/50 hover:border-gray-600/50'
					}
				>
					<AlignRight className="w-4 h-4" />
				</Button>
			</div>
		</div>
	);
});
AlignmentSection.displayName = 'AlignmentSection';

const RotationSection = memo(({ 
	onUpdate 
}: { 
	onUpdate: (updates: any) => void; 
}) => {
	return (
		<div className="space-y-2">
			<Label className="text-gray-200 text-sm font-medium">Rotation</Label>
			<div className="flex gap-2">
				<Button
					variant="outline"
					size="sm"
					onClick={() => onUpdate({ rotation: 'left' })}
					title="Rotate left 15°"
					className="bg-gray-800/50 border-gray-700/50 text-gray-200 hover:bg-gray-700/50 hover:border-gray-600/50"
				>
					<RotateCcw className="w-4 h-4" />
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={() => onUpdate({ rotation: 'right' })}
					title="Rotate right 15°"
					className="bg-gray-800/50 border-gray-700/50 text-gray-200 hover:bg-gray-700/50 hover:border-gray-600/50"
				>
					<RotateCw className="w-4 h-4" />
				</Button>
			</div>
		</div>
	);
});
RotationSection.displayName = 'RotationSection';

const EmptyState = memo(() => (
	<div className="p-6">
		<div className="text-center py-12">
			<div className="w-16 h-16 bg-gray-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
				<Type className="w-8 h-8 text-gray-400" />
			</div>
			<p className="text-gray-400/60 text-sm font-medium">No selection</p>
			<p className="text-gray-400/40 text-xs mt-1">Select a text layer to edit properties</p>
		</div>
	</div>
));
EmptyState.displayName = 'EmptyState';

export const PropertiesPanel = memo(({ selectedObjectData, onUpdateText }: PropertiesPanelProps) => {
	const { fonts, fontsLoading } = useFonts();

	const panelContent = useMemo(() => {
		if (!selectedObjectData) {
			return <EmptyState />;
		}

		return (
			<div className="p-6 space-y-6">
				<TextContentSection 
					text={selectedObjectData.text} 
					onUpdate={onUpdateText} 
				/>
				
				<FontFamilySection 
					fontFamily={selectedObjectData.fontFamily} 
					fonts={fonts} 
					fontsLoading={fontsLoading} 
					onUpdate={onUpdateText} 
				/>
				
				<FontSizeSection 
					fontSize={selectedObjectData.fontSize} 
					onUpdate={onUpdateText} 
				/>
				
				<FontWeightSection 
					fontWeight={selectedObjectData.fontWeight} 
					onUpdate={onUpdateText} 
				/>
				
				<ColorSection 
					fill={selectedObjectData.fill} 
					onUpdate={onUpdateText} 
				/>
				
				<OpacitySection 
					opacity={selectedObjectData.opacity} 
					onUpdate={onUpdateText} 
				/>
				
				<AlignmentSection 
					textAlign={selectedObjectData.textAlign} 
					onUpdate={onUpdateText} 
				/>
				
				<RotationSection 
					onUpdate={onUpdateText} 
				/>
			</div>
		);
	}, [selectedObjectData, fonts, fontsLoading, onUpdateText]);

	return panelContent;
});

PropertiesPanel.displayName = 'PropertiesPanel';