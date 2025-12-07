/**
 * Export functionality for saving composites as PNG
 */

export interface ExportOptions {
	quality?: number; // 0.0 to 1.0 for JPEG (not used for PNG)
	scale?: number; // Scale multiplier (1.0 = original size, 2.0 = 2x, etc.)
	format?: 'png' | 'jpeg';
}

/**
 * Export ImageData as a downloadable file
 */
export async function exportImage(
	imageData: ImageData,
	fileName: string,
	options: ExportOptions = {}
): Promise<void> {
	const { scale = 1.0, format = 'png', quality = 0.95 } = options;

	// Create canvas from ImageData
	const canvas = document.createElement('canvas');
	const scaledWidth = Math.round(imageData.width * scale);
	const scaledHeight = Math.round(imageData.height * scale);

	canvas.width = scaledWidth;
	canvas.height = scaledHeight;

	const ctx = canvas.getContext('2d')!;

	if (scale !== 1.0) {
		// Scale the image
		const tempCanvas = document.createElement('canvas');
		tempCanvas.width = imageData.width;
		tempCanvas.height = imageData.height;
		const tempCtx = tempCanvas.getContext('2d')!;
		tempCtx.putImageData(imageData, 0, 0);

		// Use high-quality scaling
		ctx.imageSmoothingEnabled = true;
		ctx.imageSmoothingQuality = 'high';
		ctx.drawImage(tempCanvas, 0, 0, scaledWidth, scaledHeight);
	} else {
		ctx.putImageData(imageData, 0, 0);
	}

	// Convert to blob
	const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
	const blob = await new Promise<Blob>((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (blob) resolve(blob);
				else reject(new Error('Failed to create blob'));
			},
			mimeType,
			quality
		);
	});

	// Trigger download
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = fileName;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);

	console.log(`[Export] Exported ${fileName} (${scaledWidth}x${scaledHeight}, ${format})`);
}

/**
 * Get suggested filename based on current timestamp
 */
export function getDefaultExportFilename(prefix = 'digitalglue'): string {
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
	return `${prefix}-${timestamp}.png`;
}
