'use client';

import { useEffect, useRef } from 'react';

interface CanvasContainerProps {
	onCanvasReady: (canvas: HTMLCanvasElement) => void;
	width: number;
	height: number;
}

export const CanvasContainer = ({ onCanvasReady, width, height }: CanvasContainerProps) => {
	const canvasElementRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		if (canvasElementRef.current) {
			onCanvasReady(canvasElementRef.current);
		}
	}, [onCanvasReady]);

	return (
		<div className="relative">
			<div
				className="bg-white shadow-2xl border border-gray-600/20 overflow-hidden rounded-lg"
				style={{ 
					width: `${width}px`, 
					height: `${height}px`, 
					maxWidth: 'calc(100vw - 640px)', 
					maxHeight: 'calc(100vh - 200px)'
				}}
			>
				<canvas
					ref={canvasElementRef}
					className="block w-full h-full"
				/>
			</div>
		</div>
	);
};