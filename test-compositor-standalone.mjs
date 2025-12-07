#!/usr/bin/env node
/**
 * Standalone test to verify compositor works correctly
 * Creates synthetic colored images, composites them, and verifies output
 */

import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';

// Polyfill ImageData for Node.js
globalThis.ImageData = class ImageData {
	constructor(dataOrWidth, widthOrHeight, height) {
		if (dataOrWidth instanceof Uint8ClampedArray) {
			this.data = dataOrWidth;
			this.width = widthOrHeight;
			this.height = height;
		} else {
			this.width = dataOrWidth;
			this.height = widthOrHeight;
			this.data = new Uint8ClampedArray(this.width * this.height * 4);
		}
	}
};

// Import compositor
const compositorModule = await import('./src/lib/core/compositor.ts');
const { compositeImages } = compositorModule;

// Import patterns
const patternsModule = await import('./src/lib/core/patterns.ts');
const { generatePatternMask } = patternsModule;

console.log('[Test] Starting compositor test with synthetic images...\n');

// Step 1: Create pure red image (source1)
const width = 400;
const height = 300;

console.log('[Test] Creating source1 (PURE RED):', { width, height });
const source1Data = new Uint8ClampedArray(width * height * 4);
for (let i = 0; i < source1Data.length; i += 4) {
	source1Data[i] = 255;     // R = 255 (red)
	source1Data[i + 1] = 0;   // G = 0
	source1Data[i + 2] = 0;   // B = 0
	source1Data[i + 3] = 255; // A = 255 (opaque)
}
const source1 = new ImageData(source1Data, width, height);
console.log('[Test] Source1 sample pixel (should be red):', {
	r: source1.data[0],
	g: source1.data[1],
	b: source1.data[2],
	a: source1.data[3]
});

// Step 2: Create pure blue image (source2)
console.log('\n[Test] Creating source2 (PURE BLUE):', { width, height });
const source2Data = new Uint8ClampedArray(width * height * 4);
for (let i = 0; i < source2Data.length; i += 4) {
	source2Data[i] = 0;       // R = 0
	source2Data[i + 1] = 0;   // G = 0
	source2Data[i + 2] = 255; // B = 255 (blue)
	source2Data[i + 3] = 255; // A = 255 (opaque)
}
const source2 = new ImageData(source2Data, width, height);
console.log('[Test] Source2 sample pixel (should be blue):', {
	r: source2.data[0],
	g: source2.data[1],
	b: source2.data[2],
	a: source2.data[3]
});

// Step 3: Generate half-vertical mask (left white, right black)
console.log('\n[Test] Generating half-vertical mask...');
const maskCanvas = generatePatternMask('half-vertical', width, height);
if (!maskCanvas) {
	console.error('[Test] ❌ FAILED: Could not generate mask');
	process.exit(1);
}

const maskCtx = maskCanvas.getContext('2d');
const maskImageData = maskCtx.getImageData(0, 0, width, height);

// Verify mask: left should be white (255), right should be black (0)
const leftMaskIdx = (height / 2 * width + width / 4) * 4; // Left side pixel
const rightMaskIdx = (height / 2 * width + width * 3 / 4) * 4; // Right side pixel

console.log('[Test] Mask verification:');
console.log('  Left side (should be ~255 white):', maskImageData.data[leftMaskIdx]);
console.log('  Right side (should be ~0 black):', maskImageData.data[rightMaskIdx]);

if (maskImageData.data[leftMaskIdx] < 200 || maskImageData.data[rightMaskIdx] > 50) {
	console.error('[Test] ❌ FAILED: Mask pattern incorrect!');
	process.exit(1);
}

// Step 4: Composite the images
console.log('\n[Test] Compositing images...');
console.log('  Expected: Left side RED (from source1), Right side BLUE (from source2)');

const composited = compositeImages(source1, source2, maskImageData, { invertMask: false });

// Step 5: Verify composited result
console.log('\n[Test] Verifying composited result...');

const leftPixelIdx = leftMaskIdx; // Same position as mask test
const rightPixelIdx = rightMaskIdx;

const leftPixel = {
	r: composited.data[leftPixelIdx],
	g: composited.data[leftPixelIdx + 1],
	b: composited.data[leftPixelIdx + 2],
	a: composited.data[leftPixelIdx + 3]
};

const rightPixel = {
	r: composited.data[rightPixelIdx],
	g: composited.data[rightPixelIdx + 1],
	b: composited.data[rightPixelIdx + 2],
	a: composited.data[rightPixelIdx + 3]
};

console.log('  Left pixel (should be RED 255,0,0):', leftPixel);
console.log('  Right pixel (should be BLUE 0,0,255):', rightPixel);

// Check if compositing worked correctly
const leftIsRed = leftPixel.r > 200 && leftPixel.g < 50 && leftPixel.b < 50;
const rightIsBlue = rightPixel.r < 50 && rightPixel.g < 50 && rightPixel.b > 200;

if (leftIsRed && rightIsBlue) {
	console.log('\n✅ SUCCESS! Compositor works correctly!');
	console.log('   Left side is RED (from source1)');
	console.log('   Right side is BLUE (from source2)');
} else {
	console.error('\n❌ FAILED! Compositor is broken!');
	console.error('   Left should be red, got:', leftPixel);
	console.error('   Right should be blue, got:', rightPixel);
	process.exit(1);
}

// Step 6: Save output image for visual inspection
console.log('\n[Test] Saving composite to output.png...');
const outputCanvas = createCanvas(width, height);
const outputCtx = outputCanvas.getContext('2d');
outputCtx.putImageData(composited, 0, 0);

const buffer = outputCanvas.toBuffer('image/png');
writeFileSync('test-output-composite.png', buffer);
console.log('[Test] Saved to test-output-composite.png');

// Step 7: Test with inverted mask
console.log('\n[Test] Testing with INVERTED mask...');
console.log('  Expected: Left side BLUE (from source2), Right side RED (from source1)');

const compositedInverted = compositeImages(source1, source2, maskImageData, { invertMask: true });

const leftPixelInv = {
	r: compositedInverted.data[leftPixelIdx],
	g: compositedInverted.data[leftPixelIdx + 1],
	b: compositedInverted.data[leftPixelIdx + 2],
	a: compositedInverted.data[leftPixelIdx + 3]
};

const rightPixelInv = {
	r: compositedInverted.data[rightPixelIdx],
	g: compositedInverted.data[rightPixelIdx + 1],
	b: compositedInverted.data[rightPixelIdx + 2],
	a: compositedInverted.data[rightPixelIdx + 3]
};

console.log('  Left pixel (should be BLUE 0,0,255):', leftPixelInv);
console.log('  Right pixel (should be RED 255,0,0):', rightPixelInv);

const leftIsBlue = leftPixelInv.r < 50 && leftPixelInv.g < 50 && leftPixelInv.b > 200;
const rightIsRed = rightPixelInv.r > 200 && rightPixelInv.g < 50 && rightPixelInv.b < 50;

if (leftIsBlue && rightIsRed) {
	console.log('\n✅ SUCCESS! Inverted mask works correctly!');
	console.log('   Left side is BLUE (from source2)');
	console.log('   Right side is RED (from source1)');
} else {
	console.error('\n❌ FAILED! Inverted mask is broken!');
	console.error('   Left should be blue, got:', leftPixelInv);
	console.error('   Right should be red, got:', rightPixelInv);
	process.exit(1);
}

const outputCanvasInv = createCanvas(width, height);
const outputCtxInv = outputCanvasInv.getContext('2d');
outputCtxInv.putImageData(compositedInverted, 0, 0);

const bufferInv = outputCanvasInv.toBuffer('image/png');
writeFileSync('test-output-composite-inverted.png', bufferInv);
console.log('[Test] Saved inverted to test-output-composite-inverted.png');

console.log('\n🎉 ALL TESTS PASSED! Compositor is working correctly!\n');
process.exit(0);
