/**
 * Edge effects for mask manipulation
 * Applies various artistic effects to mask edges
 */

export type EdgeEffectType = 'none' | 'soft-feather' | 'shadow-feather' | 'wavy' | 'torn-paper' | 'gradient-blend';

export interface EdgeEffectOptions {
	type: EdgeEffectType;
	intensity: number; // 0-100
	params?: Record<string, number>;
}

/**
 * Apply edge effect to a mask
 * @param maskData Input mask ImageData
 * @param options Effect options
 * @returns Modified ImageData with edge effect applied
 */
export function applyEdgeEffect(
	maskData: ImageData,
	options: EdgeEffectOptions
): ImageData {
	console.log(`[EdgeEffects] Applying ${options.type} effect, intensity: ${options.intensity}`);

	switch (options.type) {
		case 'none':
			return maskData;
		case 'soft-feather':
			return applySoftFeather(maskData, options.intensity);
		case 'shadow-feather':
			return applyShadowFeather(maskData, options.intensity);
		case 'wavy':
			return applyWavy(maskData, options.intensity);
		case 'torn-paper':
			return applyTornPaper(maskData, options.intensity);
		case 'gradient-blend':
			return applyGradientBlend(maskData, options.intensity);
		default:
			console.warn(`[EdgeEffects] Unknown effect type: ${options.type}`);
			return maskData;
	}
}

/**
 * Soft-feather: Gaussian blur on mask edges
 */
function applySoftFeather(maskData: ImageData, intensity: number): ImageData {
	const radius = Math.max(1, Math.round((intensity / 100) * 20)); // 0-20px blur
	console.log(`[EdgeEffects] Soft-feather blur radius: ${radius}px`);

	// Simple box blur approximation of Gaussian
	return boxBlur(maskData, radius);
}

/**
 * Shadow-feather: Drop shadow effect on mask edges
 */
function applyShadowFeather(maskData: ImageData, intensity: number): ImageData {
	const offset = Math.round((intensity / 100) * 10); // 0-10px offset
	const blurRadius = Math.round((intensity / 100) * 8); // 0-8px blur

	console.log(`[EdgeEffects] Shadow-feather offset: ${offset}px, blur: ${blurRadius}px`);

	const result = new ImageData(maskData.width, maskData.height);
	const src = maskData.data;
	const dst = result.data;

	// Create shadow layer (shifted and blurred)
	for (let y = 0; y < maskData.height; y++) {
		for (let x = 0; x < maskData.width; x++) {
			const i = (y * maskData.width + x) * 4;
			const shadowX = Math.max(0, Math.min(maskData.width - 1, x + offset));
			const shadowY = Math.max(0, Math.min(maskData.height - 1, y + offset));
			const shadowI = (shadowY * maskData.width + shadowX) * 4;

			// Composite original mask over shadow
			const maskAlpha = src[i] / 255;
			const shadowValue = src[shadowI] * 0.5; // Darken shadow

			const value = Math.round(shadowValue * (1 - maskAlpha) + src[i] * maskAlpha);

			dst[i] = value;
			dst[i + 1] = value;
			dst[i + 2] = value;
			dst[i + 3] = 255;
		}
	}

	return blurRadius > 0 ? boxBlur(result, blurRadius) : result;
}

/**
 * Wavy: Sine wave distortion along mask edges
 */
function applyWavy(maskData: ImageData, intensity: number): ImageData {
	const amplitude = Math.round((intensity / 100) * 15); // 0-15px wave height
	const frequency = 0.05 + (intensity / 100) * 0.1; // Wave frequency

	console.log(`[EdgeEffects] Wavy amplitude: ${amplitude}px, frequency: ${frequency}`);

	const result = new ImageData(maskData.width, maskData.height);
	const src = maskData.data;
	const dst = result.data;

	for (let y = 0; y < maskData.height; y++) {
		for (let x = 0; x < maskData.width; x++) {
			// Apply sine wave displacement
			const waveX = Math.round(x + Math.sin(y * frequency) * amplitude);
			const waveY = Math.round(y + Math.sin(x * frequency) * amplitude);

			// Clamp coordinates
			const srcX = Math.max(0, Math.min(maskData.width - 1, waveX));
			const srcY = Math.max(0, Math.min(maskData.height - 1, waveY));

			const srcI = (srcY * maskData.width + srcX) * 4;
			const dstI = (y * maskData.width + x) * 4;

			dst[dstI] = src[srcI];
			dst[dstI + 1] = src[srcI + 1];
			dst[dstI + 2] = src[srcI + 2];
			dst[dstI + 3] = 255;
		}
	}

	return result;
}

/**
 * Torn-paper: Rough, jagged edges using noise
 */
function applyTornPaper(maskData: ImageData, intensity: number): ImageData {
	const roughness = Math.round((intensity / 100) * 20); // 0-20px roughness

	console.log(`[EdgeEffects] Torn-paper roughness: ${roughness}px`);

	const result = new ImageData(maskData.width, maskData.height);
	const src = maskData.data;
	const dst = result.data;

	// Simple noise-based displacement
	for (let y = 0; y < maskData.height; y++) {
		for (let x = 0; x < maskData.width; x++) {
			// Generate pseudo-random noise (deterministic based on position)
			const noise = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
			const displacement = Math.round((noise - 0.5) * roughness * 2);

			const srcX = Math.max(0, Math.min(maskData.width - 1, x + displacement));
			const srcY = Math.max(0, Math.min(maskData.height - 1, y + displacement));

			const srcI = (srcY * maskData.width + srcX) * 4;
			const dstI = (y * maskData.width + x) * 4;

			dst[dstI] = src[srcI];
			dst[dstI + 1] = src[srcI + 1];
			dst[dstI + 2] = src[srcI + 2];
			dst[dstI + 3] = 255;
		}
	}

	return result;
}

/**
 * Gradient-blend: Smooth alpha transition along edges
 */
function applyGradientBlend(maskData: ImageData, intensity: number): ImageData {
	const featherWidth = Math.max(1, Math.round((intensity / 100) * 50)); // 1-50px feather

	console.log(`[EdgeEffects] Gradient-blend feather width: ${featherWidth}px`);

	const result = new ImageData(maskData.width, maskData.height);
	const src = maskData.data;
	const dst = result.data;

	// Calculate distance from edge for each pixel
	for (let y = 0; y < maskData.height; y++) {
		for (let x = 0; x < maskData.width; x++) {
			const i = (y * maskData.width + x) * 4;
			const value = src[i];

			// Find minimum distance to an edge (transition from black to white or vice versa)
			let minDist = featherWidth;
			for (let dy = -featherWidth; dy <= featherWidth && minDist > 0; dy++) {
				for (let dx = -featherWidth; dx <= featherWidth && minDist > 0; dx++) {
					if (dx === 0 && dy === 0) continue;

					const nx = x + dx;
					const ny = y + dy;

					if (nx >= 0 && nx < maskData.width && ny >= 0 && ny < maskData.height) {
						const ni = (ny * maskData.width + nx) * 4;
						const nValue = src[ni];

						// Check if this is an edge (significant value change)
						if (Math.abs(value - nValue) > 128) {
							const dist = Math.sqrt(dx * dx + dy * dy);
							minDist = Math.min(minDist, dist);
						}
					}
				}
			}

			// Apply gradient based on distance
			const gradientFactor = Math.min(1, minDist / featherWidth);
			const newValue = Math.round(value * gradientFactor + (value < 128 ? 0 : 255) * (1 - gradientFactor));

			dst[i] = newValue;
			dst[i + 1] = newValue;
			dst[i + 2] = newValue;
			dst[i + 3] = 255;
		}
	}

	return result;
}

/**
 * Box blur helper (approximates Gaussian blur)
 */
function boxBlur(imageData: ImageData, radius: number): ImageData {
	const result = new ImageData(imageData.width, imageData.height);
	const src = imageData.data;
	const dst = result.data;
	const width = imageData.width;
	const height = imageData.height;

	// Horizontal pass
	const temp = new Uint8ClampedArray(src.length);
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			let sum = 0;
			let count = 0;

			for (let kx = -radius; kx <= radius; kx++) {
				const nx = x + kx;
				if (nx >= 0 && nx < width) {
					const i = (y * width + nx) * 4;
					sum += src[i];
					count++;
				}
			}

			const i = (y * width + x) * 4;
			const avg = sum / count;
			temp[i] = avg;
			temp[i + 1] = avg;
			temp[i + 2] = avg;
			temp[i + 3] = 255;
		}
	}

	// Vertical pass
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			let sum = 0;
			let count = 0;

			for (let ky = -radius; ky <= radius; ky++) {
				const ny = y + ky;
				if (ny >= 0 && ny < height) {
					const i = (ny * width + x) * 4;
					sum += temp[i];
					count++;
				}
			}

			const i = (y * width + x) * 4;
			const avg = sum / count;
			dst[i] = avg;
			dst[i + 1] = avg;
			dst[i + 2] = avg;
			dst[i + 3] = 255;
		}
	}

	return result;
}
