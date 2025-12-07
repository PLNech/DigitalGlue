/**
 * Test to verify mask behavior
 * This creates synthetic images and tests the compositor
 */

// Create synthetic ImageData (Node.js doesn't have ImageData, so we mock it)
class ImageData {
	constructor(width, height) {
		this.width = width;
		this.height = height;
		this.data = new Uint8ClampedArray(width * height * 4);
	}
}

// Simple compositor for testing
function compositeImages(source1, source2, mask, options = {}) {
	const { invertMask = false } = options;
	const width = source1.width;
	const height = source1.height;
	const result = new ImageData(width, height);

	const data1 = source1.data;
	const data2 = source2.data;
	const maskData = mask.data;
	const resultData = result.data;

	for (let i = 0; i < resultData.length; i += 4) {
		let maskValue = maskData[i] / 255;
		if (invertMask) {
			maskValue = 1 - maskValue;
		}

		resultData[i] = data1[i] * maskValue + data2[i] * (1 - maskValue);
		resultData[i + 1] = data1[i + 1] * maskValue + data2[i + 1] * (1 - maskValue);
		resultData[i + 2] = data1[i + 2] * maskValue + data2[i + 2] * (1 - maskValue);
		resultData[i + 3] = 255;
	}

	return result;
}

// Test case
const width = 10;
const height = 10;

// Create pure RED source1 (R=255, G=0, B=0)
const source1 = new ImageData(width, height);
for (let i = 0; i < source1.data.length; i += 4) {
	source1.data[i] = 255;     // R
	source1.data[i + 1] = 0;   // G
	source1.data[i + 2] = 0;   // B
	source1.data[i + 3] = 255; // A
}

// Create pure BLUE source2 (R=0, G=0, B=255)
const source2 = new ImageData(width, height);
for (let i = 0; i < source2.data.length; i += 4) {
	source2.data[i] = 0;       // R
	source2.data[i + 1] = 0;   // G
	source2.data[i + 2] = 255; // B
	source2.data[i + 3] = 255; // A
}

// Create half-vertical mask (left white, right black)
const mask = new ImageData(width, height);
for (let y = 0; y < height; y++) {
	for (let x = 0; x < width; x++) {
		const i = (y * width + x) * 4;
		const maskValue = x < width / 2 ? 255 : 0; // Left white, right black
		mask.data[i] = maskValue;
		mask.data[i + 1] = maskValue;
		mask.data[i + 2] = maskValue;
		mask.data[i + 3] = 255;
	}
}

// Composite
const result = compositeImages(source1, source2, mask);

console.log('\n=== MASK BEHAVIOR TEST ===\n');
console.log('Source1: PURE RED (255,0,0)');
console.log('Source2: PURE BLUE (0,0,255)');
console.log('Mask: Left half WHITE (255), Right half BLACK (0)\n');

console.log('Expected behavior:');
console.log('  White mask (left) → 100% source1 (RED)');
console.log('  Black mask (right) → 100% source2 (BLUE)\n');

console.log('Actual results:');

// Check left pixel (white mask area)
const leftPixelIdx = (5 * width + 2) * 4; // Middle-left
const leftR = result.data[leftPixelIdx];
const leftG = result.data[leftPixelIdx + 1];
const leftB = result.data[leftPixelIdx + 2];
console.log(`  Left (white mask): RGB(${leftR}, ${leftG}, ${leftB})`);
console.log(`    ${leftR === 255 ? '✓' : '✗'} Should be RED (255,0,0)`);

// Check right pixel (black mask area)
const rightPixelIdx = (5 * width + 7) * 4; // Middle-right
const rightR = result.data[rightPixelIdx];
const rightG = result.data[rightPixelIdx + 1];
const rightB = result.data[rightPixelIdx + 2];
console.log(`  Right (black mask): RGB(${rightR}, ${rightG}, ${rightB})`);
console.log(`    ${rightB === 255 ? '✓' : '✗'} Should be BLUE (0,0,255)`);

console.log('\n=========================\n');

if (leftR === 255 && leftB === 0 && rightR === 0 && rightB === 255) {
	console.log('✓ COMPOSITOR LOGIC IS CORRECT\n');
	process.exit(0);
} else {
	console.log('✗ COMPOSITOR LOGIC IS WRONG\n');
	process.exit(1);
}
