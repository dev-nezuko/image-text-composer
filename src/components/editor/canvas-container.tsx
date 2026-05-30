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
		<div className="flex-1 flex items-center justify-center p-4 bg-gray-100">
			<div
				className="bg-white shadow-lg border border-gray-200 overflow-hidden"
				style={{ width: `${width}px`, height: `${height}px`, maxWidth: '100%', maxHeight: '100%' }}
			>
				<canvas
					ref={canvasElementRef}
					className="block"
				/>
			</div>
		</div>
	);
};