/**
 * Web Worker for image compositing
 * Handles all heavy image processing off the main thread
 */

// Import patterns generator (will be bundled with worker)
import { generatePatternMask, type PatternId } from '../patterns';

export interface CompositorMessage {
	type: 'composite' | 'generate-mask';
	payload: any;
}

export interface CompositeRequest {
	source1: ImageData;
	source2: ImageData;
	mask: ImageData;
	adjustments1: Adjustments;
	adjustments2: Adjustments;
}

export interface MaskGenerationRequest {
	type: 'pattern' | 'upload';
	width: number;
	height: number;
	patternId?: PatternId;
	imageData?: ImageData;
	threshold?: number;
	invert?: boolean;
}

export interface Adjustments {
	rotation: number;
	brightness: number;
	contrast: number;
	saturation: number;
}

self.onmessage = async (e: MessageEvent<CompositorMessage>) => {
	const { type, payload } = e.data;

	try {
		switch (type) {
			case 'generate-mask':
				await handleMaskGeneration(payload);
				break;

			case 'composite':
				await handleComposite(payload);
				break;

			default:
				console.error('[Compositor Worker] Unknown message type:', type);
		}
	} catch (error) {
		console.error('[Compositor Worker] Error:', error);
		self.postMessage({ type: 'error', error: String(error) });
	}
};

async function handleMaskGeneration(request: MaskGenerationRequest) {
	console.log('[Compositor Worker] Generating mask:', request);

	let maskCanvas: HTMLCanvasElement | OffscreenCanvas;

	if (request.type === 'pattern' && request.patternId) {
		// Generate pattern mask
		const canvas = generatePatternMask(request.patternId, request.width, request.height);
		if (!canvas) {
			throw new Error('Failed to generate pattern mask');
		}
		maskCanvas = canvas;
	} else if (request.type === 'upload' && request.imageData) {
		// Process uploaded image as mask
		const offscreen = new OffscreenCanvas(request.width, request.height);
		const ctx = offscreen.getContext('2d')!;

		// Draw image data
		ctx.putImageData(request.imageData, 0, 0);

		// Convert to grayscale and apply threshold
		const imageData = ctx.getImageData(0, 0, request.width, request.height);
		const data = imageData.data;
		const threshold = request.threshold ?? 128;

		for (let i = 0; i < data.length; i += 4) {
			const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
			const bw = gray > threshold ? 255 : 0;
			data[i] = data[i + 1] = data[i + 2] = bw;
		}

		ctx.putImageData(imageData, 0, 0);
		maskCanvas = offscreen;
	} else {
		throw new Error('Invalid mask generation request');
	}

	// Apply invert if requested
	if (request.invert) {
		const ctx = maskCanvas.getContext('2d')!;
		const imageData = ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
		const data = imageData.data;

		for (let i = 0; i < data.length; i += 4) {
			data[i] = 255 - data[i];
			data[i + 1] = 255 - data[i + 1];
			data[i + 2] = 255 - data[i + 2];
		}

		ctx.putImageData(imageData, 0, 0);
	}

	// Convert to ImageData for transfer
	const ctx = maskCanvas.getContext('2d')!;
	const maskImageData = ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);

	console.log('[Compositor Worker] Mask generated:', maskImageData.width, 'x', maskImageData.height);

	self.postMessage(
		{
			type: 'mask-generated',
			maskData: maskImageData
		},
		{ transfer: [maskImageData.data.buffer] }
	);
}

async function handleComposite(request: CompositeRequest) {
	console.log('[Compositor Worker] Compositing images');

	const { source1, source2, mask, adjustments1, adjustments2 } = request;

	// Create offscreen canvases
	const width = source1.width;
	const height = source1.height;

	// Apply adjustments to source1
	const adjusted1 = applyAdjustments(source1, adjustments1);

	// Apply adjustments to source2
	const adjusted2 = applyAdjustments(source2, adjustments2);

	// Composite using mask
	const result = compositeWithMask(adjusted1, adjusted2, mask);

	console.log('[Compositor Worker] Composite complete');

	self.postMessage(
		{
			type: 'composite-complete',
			result
		},
		{ transfer: [result.data.buffer] }
	);
}

function applyAdjustments(imageData: ImageData, adjustments: Adjustments): ImageData {
	const { brightness, contrast, saturation } = adjustments;

	// Clone image data
	const result = new ImageData(
		new Uint8ClampedArray(imageData.data),
		imageData.width,
		imageData.height
	);

	const data = result.data;

	// Normalize adjustments
	const brightnessAmount = brightness / 100; // -1 to 1
	const contrastFactor = (contrast + 100) / 100; // 0 to 2
	const saturationFactor = 1 + saturation / 100; // 0 to 2

	for (let i = 0; i < data.length; i += 4) {
		let r = data[i];
		let g = data[i + 1];
		let b = data[i + 2];

		// Apply brightness
		r += brightnessAmount * 255;
		g += brightnessAmount * 255;
		b += brightnessAmount * 255;

		// Apply contrast
		r = ((r / 255 - 0.5) * contrastFactor + 0.5) * 255;
		g = ((g / 255 - 0.5) * contrastFactor + 0.5) * 255;
		b = ((b / 255 - 0.5) * contrastFactor + 0.5) * 255;

		// Apply saturation
		const gray = 0.299 * r + 0.587 * g + 0.114 * b;
		r = gray + (r - gray) * saturationFactor;
		g = gray + (g - gray) * saturationFactor;
		b = gray + (b - gray) * saturationFactor;

		// Clamp values
		data[i] = Math.max(0, Math.min(255, r));
		data[i + 1] = Math.max(0, Math.min(255, g));
		data[i + 2] = Math.max(0, Math.min(255, b));
	}

	return result;
}

function compositeWithMask(
	source1: ImageData,
	source2: ImageData,
	mask: ImageData
): ImageData {
	const result = new ImageData(source1.width, source1.height);

	const data1 = source1.data;
	const data2 = source2.data;
	const maskData = mask.data;
	const resultData = result.data;

	// Composite pixel by pixel
	// White mask (255) = source1, Black mask (0) = source2
	for (let i = 0; i < resultData.length; i += 4) {
		const maskValue = maskData[i] / 255; // 0 to 1

		// Linear interpolation between source1 and source2
		resultData[i] = data1[i] * maskValue + data2[i] * (1 - maskValue); // R
		resultData[i + 1] = data1[i + 1] * maskValue + data2[i + 1] * (1 - maskValue); // G
		resultData[i + 2] = data1[i + 2] * maskValue + data2[i + 2] * (1 - maskValue); // B
		resultData[i + 3] = 255; // Alpha
	}

	return result;
}

console.log('[Compositor Worker] Initialized');
