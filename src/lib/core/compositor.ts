/**
 * Image compositor for mask-based blending
 * Combines two source images using a mask:
 * - White mask areas (255) show source1
 * - Black mask areas (0) show source2
 * - Gray values blend proportionally
 */

export interface CompositeOptions {
	invertMask?: boolean;
}

/**
 * Composite two images using a mask
 * @param source1 First source image
 * @param source2 Second source image
 * @param mask Binary/grayscale mask (uses R channel)
 * @param options Composite options (invertMask)
 * @returns Composited ImageData
 */
export function compositeImages(
	source1: ImageData,
	source2: ImageData,
	mask: ImageData,
	options: CompositeOptions = {}
): ImageData {
	const { invertMask = false } = options;

	console.log('[Compositor] Compositing images:', {
		source1: { width: source1.width, height: source1.height },
		source2: { width: source2.width, height: source2.height },
		mask: { width: mask.width, height: mask.height },
		invertMask
	});

	// Ensure all images are same size
	if (
		source1.width !== source2.width ||
		source1.height !== source2.height ||
		source1.width !== mask.width ||
		source1.height !== mask.height
	) {
		throw new Error('Source images and mask must have the same dimensions');
	}

	const width = source1.width;
	const height = source1.height;
	const result = new ImageData(width, height);

	const data1 = source1.data;
	const data2 = source2.data;
	const maskData = mask.data;
	const resultData = result.data;

	// Process each pixel
	for (let i = 0; i < resultData.length; i += 4) {
		// Get mask value (using R channel, normalized to 0-1)
		let maskValue = maskData[i] / 255;

		// Invert if requested
		if (invertMask) {
			maskValue = 1 - maskValue;
		}

		// Blend: result = source1 * maskValue + source2 * (1 - maskValue)
		resultData[i] = data1[i] * maskValue + data2[i] * (1 - maskValue); // R
		resultData[i + 1] = data1[i + 1] * maskValue + data2[i + 1] * (1 - maskValue); // G
		resultData[i + 2] = data1[i + 2] * maskValue + data2[i + 2] * (1 - maskValue); // B
		resultData[i + 3] = 255; // Full opacity
	}

	console.log('[Compositor] Composite complete');

	return result;
}

/**
 * Apply adjustments to an image (brightness, contrast, etc.)
 * This is a placeholder - will be implemented with proper TDD in next phase
 */
export interface Adjustments {
	brightness?: number; // -100 to 100
	contrast?: number; // -100 to 100
	saturation?: number; // -100 to 100
	rotation?: number; // degrees
}

export function applyAdjustments(
	imageData: ImageData,
	adjustments: Adjustments
): ImageData {
	// TODO: Implement with TDD
	console.log('[Compositor] Apply adjustments:', adjustments);
	return imageData;
}
