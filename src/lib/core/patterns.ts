/**
 * Pattern mask generator
 * Generates canvas-based masks for various geometric patterns
 */

export type PatternId =
	| 'half-vertical'
	| 'half-horizontal'
	| 'diagonal'
	| 'circle'
	| 'diamond'
	| 'stripes-v'
	| 'stripes-h'
	| 'checkerboard';

export interface PatternConfig {
	id: PatternId;
	name: string;
	preview: string;
	isInfinite?: boolean; // True for tiling patterns (stripes, checkerboard)
	generate: (width: number, height: number, scale?: number) => HTMLCanvasElement;
}

/**
 * Generate a binary mask canvas (white = source1, black = source2)
 */
function createMaskCanvas(width: number, height: number): HTMLCanvasElement {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	return canvas;
}

export const patterns: Record<PatternId, PatternConfig> = {
	'half-vertical': {
		id: 'half-vertical',
		name: 'Half Vertical',
		preview: '◧',
		generate: (width, height) => {
			const canvas = createMaskCanvas(width, height);
			const ctx = canvas.getContext('2d')!;

			// Left half white (source1)
			ctx.fillStyle = 'white';
			ctx.fillRect(0, 0, width / 2, height);

			// Right half black (source2)
			ctx.fillStyle = 'black';
			ctx.fillRect(width / 2, 0, width / 2, height);

			return canvas;
		}
	},

	'half-horizontal': {
		id: 'half-horizontal',
		name: 'Half Horizontal',
		preview: '⬒',
		generate: (width, height) => {
			const canvas = createMaskCanvas(width, height);
			const ctx = canvas.getContext('2d')!;

			// Top half white
			ctx.fillStyle = 'white';
			ctx.fillRect(0, 0, width, height / 2);

			// Bottom half black
			ctx.fillStyle = 'black';
			ctx.fillRect(0, height / 2, width, height / 2);

			return canvas;
		}
	},

	diagonal: {
		id: 'diagonal',
		name: 'Diagonal',
		preview: '◪',
		generate: (width, height) => {
			const canvas = createMaskCanvas(width, height);
			const ctx = canvas.getContext('2d')!;

			// White background
			ctx.fillStyle = 'white';
			ctx.fillRect(0, 0, width, height);

			// Black triangle (bottom-left to top-right diagonal)
			ctx.fillStyle = 'black';
			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.lineTo(width, height);
			ctx.lineTo(0, height);
			ctx.closePath();
			ctx.fill();

			return canvas;
		}
	},

	circle: {
		id: 'circle',
		name: 'Circle',
		preview: '◯',
		generate: (width, height) => {
			const canvas = createMaskCanvas(width, height);
			const ctx = canvas.getContext('2d')!;

			// Black background
			ctx.fillStyle = 'black';
			ctx.fillRect(0, 0, width, height);

			// White circle in center
			ctx.fillStyle = 'white';
			const radius = Math.min(width, height) * 0.4;
			ctx.beginPath();
			ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
			ctx.fill();

			return canvas;
		}
	},

	diamond: {
		id: 'diamond',
		name: 'Diamond',
		preview: '◇',
		generate: (width, height) => {
			const canvas = createMaskCanvas(width, height);
			const ctx = canvas.getContext('2d')!;

			// Black background
			ctx.fillStyle = 'black';
			ctx.fillRect(0, 0, width, height);

			// White diamond
			ctx.fillStyle = 'white';
			ctx.beginPath();
			ctx.moveTo(width / 2, height * 0.1); // Top
			ctx.lineTo(width * 0.9, height / 2); // Right
			ctx.lineTo(width / 2, height * 0.9); // Bottom
			ctx.lineTo(width * 0.1, height / 2); // Left
			ctx.closePath();
			ctx.fill();

			return canvas;
		}
	},

	'stripes-v': {
		id: 'stripes-v',
		name: 'Vertical Stripes',
		preview: '║',
		isInfinite: true,
		generate: (width, height, scale = 100) => {
			const canvas = createMaskCanvas(width, height);
			const ctx = canvas.getContext('2d')!;

			// Base stripe count at 100% scale
			const baseStripeCount = 8;
			// Density inversely proportional to scale (50% scale = 2x density)
			const densityMultiplier = 100 / scale;
			const stripeCount = Math.max(2, Math.round(baseStripeCount * densityMultiplier));
			const stripeWidth = width / stripeCount;

			for (let i = 0; i < stripeCount; i++) {
				ctx.fillStyle = i % 2 === 0 ? 'white' : 'black';
				ctx.fillRect(i * stripeWidth, 0, stripeWidth, height);
			}

			return canvas;
		}
	},

	'stripes-h': {
		id: 'stripes-h',
		name: 'Horizontal Stripes',
		preview: '═',
		isInfinite: true,
		generate: (width, height, scale = 100) => {
			const canvas = createMaskCanvas(width, height);
			const ctx = canvas.getContext('2d')!;

			// Base stripe count at 100% scale
			const baseStripeCount = 8;
			// Density inversely proportional to scale (50% scale = 2x density)
			const densityMultiplier = 100 / scale;
			const stripeCount = Math.max(2, Math.round(baseStripeCount * densityMultiplier));
			const stripeHeight = height / stripeCount;

			for (let i = 0; i < stripeCount; i++) {
				ctx.fillStyle = i % 2 === 0 ? 'white' : 'black';
				ctx.fillRect(0, i * stripeHeight, width, stripeHeight);
			}

			return canvas;
		}
	},

	checkerboard: {
		id: 'checkerboard',
		name: 'Checkerboard',
		preview: '▦',
		isInfinite: true,
		generate: (width, height, scale = 100) => {
			const canvas = createMaskCanvas(width, height);
			const ctx = canvas.getContext('2d')!;

			// Base cell count at 100% scale
			const baseCellCount = 8;
			// Density inversely proportional to scale (50% scale = 2x density)
			const densityMultiplier = 100 / scale;
			const rows = Math.max(2, Math.round(baseCellCount * densityMultiplier));
			const cols = Math.max(2, Math.round(baseCellCount * densityMultiplier));
			const cellWidth = width / cols;
			const cellHeight = height / rows;

			for (let row = 0; row < rows; row++) {
				for (let col = 0; col < cols; col++) {
					ctx.fillStyle = (row + col) % 2 === 0 ? 'white' : 'black';
					ctx.fillRect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
				}
			}

			return canvas;
		}
	}
};

/**
 * Get a pattern generator by ID
 */
export function getPattern(id: PatternId): PatternConfig | undefined {
	return patterns[id];
}

/**
 * Generate a mask canvas for a given pattern
 */
export function generatePatternMask(
	patternId: PatternId,
	width: number,
	height: number,
	scale = 100
): HTMLCanvasElement | null {
	const pattern = getPattern(patternId);
	if (!pattern) {
		console.error(`[Patterns] Unknown pattern: ${patternId}`);
		return null;
	}

	console.log(`[Patterns] Generating ${patternId} mask at ${width}x${height}, scale=${scale}%`);
	return pattern.generate(width, height, scale);
}
