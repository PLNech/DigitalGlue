import { describe, it, expect, vi, beforeAll } from 'vitest';

// Polyfill ImageData for jsdom
beforeAll(() => {
	if (typeof ImageData === 'undefined') {
		(global as any).ImageData = class ImageData {
			data: Uint8ClampedArray;
			width: number;
			height: number;

			constructor(dataOrWidth: Uint8ClampedArray | number, widthOrHeight: number, height?: number) {
				if (dataOrWidth instanceof Uint8ClampedArray) {
					this.data = dataOrWidth;
					this.width = widthOrHeight;
					this.height = height!;
				} else {
					this.width = dataOrWidth;
					this.height = widthOrHeight;
					this.data = new Uint8ClampedArray(this.width * this.height * 4);
				}
			}
		};
	}
});

const createMockImageData = (width: number, height: number, fillColor: [number, number, number, number]): ImageData => {
	const data = new Uint8ClampedArray(width * height * 4);
	for (let i = 0; i < data.length; i += 4) {
		data[i] = fillColor[0];     // R
		data[i + 1] = fillColor[1]; // G
		data[i + 2] = fillColor[2]; // B
		data[i + 3] = fillColor[3]; // A
	}
	return new ImageData(data, width, height);
};

describe('Compositor', () => {
	describe('compositeImages', () => {
		it('should apply white mask areas from source1', async () => {
			// Create test images: source1 is red, source2 is blue
			const source1 = createMockImageData(10, 10, [255, 0, 0, 255]); // Red
			const source2 = createMockImageData(10, 10, [0, 0, 255, 255]); // Blue

			// Create mask: left half white (255), right half black (0)
			const maskData = new Uint8ClampedArray(10 * 10 * 4);
			for (let y = 0; y < 10; y++) {
				for (let x = 0; x < 10; x++) {
					const idx = (y * 10 + x) * 4;
					const isWhite = x < 5; // Left half
					const value = isWhite ? 255 : 0;
					maskData[idx] = value;
					maskData[idx + 1] = value;
					maskData[idx + 2] = value;
					maskData[idx + 3] = 255;
				}
			}
			const mask = new ImageData(maskData, 10, 10);

			// Import the compositeImages function
			// (Will create this next)
			const { compositeImages } = await import('./compositor');

			const result = compositeImages(source1, source2, mask);

			// Check result: left half should be red (source1), right half should be blue (source2)
			const resultData = result.data;

			// Check left pixel (should be red from source1)
			const leftIdx = (5 * 10 + 2) * 4; // Middle-left pixel
			expect(resultData[leftIdx]).toBe(255);     // R
			expect(resultData[leftIdx + 1]).toBe(0);   // G
			expect(resultData[leftIdx + 2]).toBe(0);   // B

			// Check right pixel (should be blue from source2)
			const rightIdx = (5 * 10 + 7) * 4; // Middle-right pixel
			expect(resultData[rightIdx]).toBe(0);      // R
			expect(resultData[rightIdx + 1]).toBe(0);  // G
			expect(resultData[rightIdx + 2]).toBe(255); // B
		});

		it('should handle invert mask option', async () => {
			const source1 = createMockImageData(10, 10, [255, 0, 0, 255]); // Red
			const source2 = createMockImageData(10, 10, [0, 0, 255, 255]); // Blue

			// Create mask: left half white
			const maskData = new Uint8ClampedArray(10 * 10 * 4);
			for (let y = 0; y < 10; y++) {
				for (let x = 0; x < 10; x++) {
					const idx = (y * 10 + x) * 4;
					const value = x < 5 ? 255 : 0;
					maskData[idx] = value;
					maskData[idx + 1] = value;
					maskData[idx + 2] = value;
					maskData[idx + 3] = 255;
				}
			}
			const mask = new ImageData(maskData, 10, 10);

			const { compositeImages } = await import('./compositor');

			// With invert=true, white areas should show source2, black should show source1
			const result = compositeImages(source1, source2, mask, { invertMask: true });

			const leftIdx = (5 * 10 + 2) * 4;
			// Left was white, with invert should now show source2 (blue)
			expect(result.data[leftIdx]).toBe(0);      // R
			expect(result.data[leftIdx + 1]).toBe(0);  // G
			expect(result.data[leftIdx + 2]).toBe(255); // B
		});

		it('should handle grayscale mask values as alpha blend', async () => {
			const source1 = createMockImageData(10, 10, [255, 0, 0, 255]); // Red
			const source2 = createMockImageData(10, 10, [0, 0, 255, 255]); // Blue

			// Create mask with middle gray (128) - should blend 50/50
			const maskData = new Uint8ClampedArray(10 * 10 * 4);
			for (let i = 0; i < maskData.length; i += 4) {
				maskData[i] = 128;
				maskData[i + 1] = 128;
				maskData[i + 2] = 128;
				maskData[i + 3] = 255;
			}
			const mask = new ImageData(maskData, 10, 10);

			const { compositeImages } = await import('./compositor');

			const result = compositeImages(source1, source2, mask);

			// Should be a blend of red and blue (purple-ish)
			const idx = (5 * 10 + 5) * 4;
			expect(result.data[idx]).toBeGreaterThan(100);     // Has some red
			expect(result.data[idx + 2]).toBeGreaterThan(100); // Has some blue
		});
	});
});
