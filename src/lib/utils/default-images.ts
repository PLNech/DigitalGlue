/**
 * Default images for easier debugging and testing
 * Loads sample images automatically on startup
 */

export async function loadDefaultImages(): Promise<{
	image1: string | null;
	image2: string | null;
}> {
	try {
		// Fetch sample images from public directory
		const sample1 = await fetch('/samples/sources/casey-horner-RmoWqDCqN2E-unsplash.jpg');
		const sample2 = await fetch('/samples/sources/ameenfahmy-8qv3lqjrj3g-unsplash.jpg');

		if (!sample1.ok || !sample2.ok) {
			console.warn('[Default Images] Could not load sample images');
			return { image1: null, image2: null };
		}

		const blob1 = await sample1.blob();
		const blob2 = await sample2.blob();

		const image1 = await blobToDataURL(blob1);
		const image2 = await blobToDataURL(blob2);

		console.log('[Default Images] Loaded default images successfully');

		return { image1, image2 };
	} catch (error) {
		console.error('[Default Images] Error loading defaults:', error);
		return { image1: null, image2: null };
	}
}

function blobToDataURL(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});
}

export function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve({ width: img.width, height: img.height });
		img.onerror = reject;
		img.src = dataUrl;
	});
}
