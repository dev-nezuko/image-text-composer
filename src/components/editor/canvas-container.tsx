'use client';

import { useEffect, useRef } from 'react';
import type { Size } from '@/lib/preview';

interface CanvasContainerProps {
	onCanvasReady: (canvas: HTMLCanvasElement) => void;
	onViewportResize: (box: Size) => void;
	hasImage: boolean;
}

export const CanvasContainer = ({ onCanvasReady, onViewportResize, hasImage }: CanvasContainerProps) => {
	const canvasElementRef = useRef<HTMLCanvasElement>(null);
	const stageRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (canvasElementRef.current) {
			onCanvasReady(canvasElementRef.current);
		}
	}, [onCanvasReady]);

	useEffect(() => {
		const stage = stageRef.current;
		if (!stage) return;
		const observer = new ResizeObserver(([entry]) => {
			const { width, height } = entry.contentRect;
			onViewportResize({ width, height });
		});
		observer.observe(stage);
		return () => observer.disconnect();
	}, [onViewportResize]);

	return (
		<div className="flex h-full min-h-0 flex-col gap-3">
			<div ref={stageRef} className="flex min-h-[220px] flex-1 items-center justify-center overflow-hidden">
				<div className="rounded-sm shadow-[0_12px_40px_rgba(0,0,0,0.55)] ring-1 ring-black/40">
					<canvas ref={canvasElementRef} aria-label="Design canvas" />
				</div>
			</div>
			{!hasImage && (
				<p className="text-center text-sm text-muted-foreground">
					No image yet. Upload a PNG, or add text to the blank canvas.
				</p>
			)}
		</div>
	);
};
