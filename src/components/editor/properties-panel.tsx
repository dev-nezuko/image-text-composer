'use client';

import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { HexColorPicker } from 'react-colorful';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { loadGoogleFonts, numericFontWeight } from '@/lib/google-font';
import type { GoogleFont, SelectedText, TextStyleUpdate } from '@/lib/types';
import { Palette, AlignLeft, AlignCenter, AlignRight, RotateCcw, RotateCw, Type } from 'lucide-react';

interface PropertiesPanelProps {
	selectedObjectData: SelectedText | null;
	onUpdateText: (updates: TextStyleUpdate) => void;
}

type Update = (updates: TextStyleUpdate) => void;

const FONT_WEIGHTS = [
	{ value: '300', label: 'Light' },
	{ value: '400', label: 'Regular' },
	{ value: '500', label: 'Medium' },
	{ value: '600', label: 'Semi Bold' },
	{ value: '700', label: 'Bold' },
	{ value: '800', label: 'Extra Bold' },
	{ value: '900', label: 'Black' },
];

const ALIGNMENTS = [
	{ value: 'left', label: 'Align left', Icon: AlignLeft },
	{ value: 'center', label: 'Align center', Icon: AlignCenter },
	{ value: 'right', label: 'Align right', Icon: AlignRight },
] as const;

const labelClass = 'text-xs font-medium uppercase tracking-wider text-muted-foreground';

const useFonts = () => {
	const [fonts, setFonts] = useState<GoogleFont[]>([]);
	const [fontsLoading, setFontsLoading] = useState(true);

	useEffect(() => {
		let mounted = true;
		loadGoogleFonts()
			.then((loaded) => {
				if (mounted) setFonts(loaded);
			})
			.finally(() => {
				if (mounted) setFontsLoading(false);
			});
		return () => {
			mounted = false;
		};
	}, []);

	return { fonts, fontsLoading };
};

const useDebouncedUpdate = (callback: Update, delay: number) => {
	const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

	// A pending edit must not land on whichever layer is selected next.
	useEffect(() => () => clearTimeout(timeoutRef.current), []);

	return useCallback((updates: TextStyleUpdate) => {
		clearTimeout(timeoutRef.current);
		timeoutRef.current = setTimeout(() => callback(updates), delay);
	}, [callback, delay]);
};

const TextContentSection = memo(function TextContentSection({ text, onUpdate }: { text: string; onUpdate: Update }) {
	const debouncedUpdate = useDebouncedUpdate(onUpdate, 300);

	return (
		<div className="space-y-2">
			<Label htmlFor="text-content" className={labelClass}>Content</Label>
			<Textarea
				id="text-content"
				defaultValue={text}
				onChange={(e) => debouncedUpdate({ text: e.target.value })}
				className="resize-none"
				rows={3}
				placeholder="Caption text"
			/>
		</div>
	);
});

const FontFamilySection = memo(function FontFamilySection({
	fontFamily,
	fonts,
	fontsLoading,
	onUpdate,
}: {
	fontFamily: string;
	fonts: GoogleFont[];
	fontsLoading: boolean;
	onUpdate: Update;
}) {
	return (
		<div className="space-y-2">
			<Label htmlFor="font-family" className={labelClass}>Font Family</Label>
			<Select value={fontFamily} onValueChange={(family) => onUpdate({ fontFamily: family })}>
				<SelectTrigger id="font-family">
					<SelectValue placeholder="Choose a font" />
				</SelectTrigger>
				<SelectContent className="max-h-60">
					{fontsLoading ? (
						<SelectItem value="loading" disabled>Loading fonts…</SelectItem>
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
	);
});

const FontSizeSection = memo(function FontSizeSection({ fontSize, onUpdate }: { fontSize: number; onUpdate: Update }) {
	const debouncedUpdate = useDebouncedUpdate(onUpdate, 100);
	const [size, setSize] = useState(fontSize);

	useEffect(() => {
		setSize(fontSize);
	}, [fontSize]);

	const changeSize = (value: number) => {
		const clamped = Math.min(200, Math.max(8, value));
		setSize(clamped);
		debouncedUpdate({ fontSize: clamped });
	};

	return (
		<div className="space-y-2">
			<Label htmlFor="font-size" className={labelClass}>Font Size</Label>
			<div className="flex items-center gap-3">
				<Slider
					value={[size]}
					onValueChange={([value]) => changeSize(value)}
					aria-label="Font size"
					max={200}
					min={8}
					step={1}
					className="flex-1"
				/>
				<Input
					id="font-size"
					type="number"
					value={size}
					onChange={(e) => changeSize(Number.parseInt(e.target.value, 10) || 8)}
					className="w-20 font-mono"
					min={8}
					max={200}
				/>
			</div>
		</div>
	);
});

const FontWeightSection = memo(function FontWeightSection({ fontWeight, onUpdate }: { fontWeight: string | number; onUpdate: Update }) {
	return (
		<div className="space-y-2">
			<Label htmlFor="font-weight" className={labelClass}>Font Weight</Label>
			<Select value={String(numericFontWeight(fontWeight))} onValueChange={(value) => onUpdate({ fontWeight: value })}>
				<SelectTrigger id="font-weight">
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
	);
});

const ColorSection = memo(function ColorSection({ fill, onUpdate }: { fill: string; onUpdate: Update }) {
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
			<Label htmlFor="text-color" className={labelClass}>Color</Label>
			<Popover>
				<PopoverTrigger asChild>
					<Button id="text-color" variant="outline" className="w-full justify-start gap-3 font-mono">
						<span className="h-4 w-4 rounded-sm border border-input" style={{ backgroundColor: color }} aria-hidden />
						<Palette className="h-4 w-4" aria-hidden />
						{color.toUpperCase()}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-3" align="start">
					<HexColorPicker color={color} onChange={handleColorChange} />
				</PopoverContent>
			</Popover>
		</div>
	);
});

const OpacitySection = memo(function OpacitySection({ opacity, onUpdate }: { opacity: number; onUpdate: Update }) {
	const debouncedUpdate = useDebouncedUpdate(onUpdate, 100);

	return (
		<div className="space-y-2">
			<p id="opacity-label" className={labelClass}>Opacity</p>
			<div className="flex items-center gap-3">
				<Slider
					value={[opacity * 100]}
					onValueChange={([value]) => debouncedUpdate({ opacity: value / 100 })}
					aria-labelledby="opacity-label"
					max={100}
					min={0}
					step={1}
					className="flex-1"
				/>
				<span className="w-12 text-right font-mono text-sm text-muted-foreground">{Math.round(opacity * 100)}%</span>
			</div>
		</div>
	);
});

const AlignmentSection = memo(function AlignmentSection({ textAlign, onUpdate }: { textAlign: string; onUpdate: Update }) {
	return (
		<div className="space-y-2">
			<p id="alignment-label" className={labelClass}>Alignment</p>
			<div className="flex gap-2" role="group" aria-labelledby="alignment-label">
				{ALIGNMENTS.map(({ value, label, Icon }) => (
					<Button
						key={value}
						variant={textAlign === value ? 'default' : 'outline'}
						size="icon"
						aria-label={label}
						aria-pressed={textAlign === value}
						onClick={() => onUpdate({ textAlign: value })}
					>
						<Icon className="h-4 w-4" aria-hidden />
					</Button>
				))}
			</div>
		</div>
	);
});

const RotationSection = memo(function RotationSection({ onUpdate }: { onUpdate: Update }) {
	return (
		<div className="space-y-2">
			<p id="rotation-label" className={labelClass}>Rotation</p>
			<div className="flex gap-2" role="group" aria-labelledby="rotation-label">
				<Button variant="outline" size="icon" aria-label="Rotate left 15 degrees" title="Rotate left 15°" onClick={() => onUpdate({ rotation: 'left' })}>
					<RotateCcw className="h-4 w-4" aria-hidden />
				</Button>
				<Button variant="outline" size="icon" aria-label="Rotate right 15 degrees" title="Rotate right 15°" onClick={() => onUpdate({ rotation: 'right' })}>
					<RotateCw className="h-4 w-4" aria-hidden />
				</Button>
			</div>
		</div>
	);
});

const EmptyState = () => (
	<div className="flex flex-col items-center px-6 py-10 text-center">
		<Type className="mb-3 h-7 w-7 text-muted-foreground" aria-hidden />
		<p className="text-sm font-medium">No selection</p>
		<p className="mt-1 text-xs text-muted-foreground">Select a text layer to edit its font, colour and alignment.</p>
	</div>
);

export const PropertiesPanel = memo(function PropertiesPanel({ selectedObjectData, onUpdateText }: PropertiesPanelProps) {
	const { fonts, fontsLoading } = useFonts();

	if (!selectedObjectData) return <EmptyState />;

	// Keyed by layer so uncontrolled fields reset when the selection changes.
	return (
		<div key={selectedObjectData.id} className="space-y-5 p-4">
			<TextContentSection text={selectedObjectData.text} onUpdate={onUpdateText} />
			<FontFamilySection
				fontFamily={selectedObjectData.fontFamily}
				fonts={fonts}
				fontsLoading={fontsLoading}
				onUpdate={onUpdateText}
			/>
			<FontSizeSection fontSize={selectedObjectData.fontSize} onUpdate={onUpdateText} />
			<FontWeightSection fontWeight={selectedObjectData.fontWeight} onUpdate={onUpdateText} />
			<ColorSection fill={selectedObjectData.fill} onUpdate={onUpdateText} />
			<OpacitySection opacity={selectedObjectData.opacity} onUpdate={onUpdateText} />
			<AlignmentSection textAlign={selectedObjectData.textAlign} onUpdate={onUpdateText} />
			<RotationSection onUpdate={onUpdateText} />
		</div>
	);
});
