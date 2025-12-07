<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { projectState } from '$state/project';
	import { uiState } from '$state/ui';
	import { exportTrigger } from '$state/export-trigger';
	import { exportImage, getDefaultExportFilename } from '$lib/io/export';

	let containerDiv: HTMLDivElement;
	let Konva: typeof import('konva').default | null = null;
	let stage: any = null;
	let layer: any = null;
	let compositeImage: any = null;

	// Store current composite for export
	let currentComposite: ImageData | null = null;

	// Worker for off-main-thread processing
	let worker: Worker | null = null;

	onMount(async () => {
		console.log('[PreviewCanvas] Mounting...');
		if (browser) {
			const konvaModule = await import('konva');
			Konva = konvaModule.default;
			console.log('[PreviewCanvas] Konva loaded');

			// Initialize worker
			try {
				worker = new Worker(
					new URL('$lib/core/workers/compositor.worker.ts', import.meta.url),
					{ type: 'module' }
				);
				worker.onmessage = handleWorkerMessage;
				console.log('[PreviewCanvas] Worker initialized');
			} catch (err) {
				console.error('[PreviewCanvas] Worker failed to initialize:', err);
			}

			initializeStage();
		}
	});

	onDestroy(() => {
		console.log('[PreviewCanvas] Destroying...');
		worker?.terminate();
		stage?.destroy();
	});

	function handleWorkerMessage(e: MessageEvent) {
		const { type, result, maskData } = e.data;

		if (type === 'composite-complete') {
			console.log('[PreviewCanvas] Composite complete from worker');
			displayComposite(result);
		} else if (type === 'mask-generated') {
			console.log('[PreviewCanvas] Mask generated from worker');
			// Could cache this for preview
		} else if (type === 'error') {
			console.error('[PreviewCanvas] Worker error:', e.data.error);
		}
	}

	function initializeStage() {
		if (!containerDiv || !Konva) return;

		console.log('[PreviewCanvas] Initializing Konva stage');
		const width = containerDiv.clientWidth;
		const height = containerDiv.clientHeight;

		stage = new Konva.Stage({
			container: containerDiv,
			width,
			height,
			draggable: true
		});

		layer = new Konva.Layer();
		stage.add(layer);

		// Mouse wheel zoom
		stage.on('wheel', (e: any) => {
			e.evt.preventDefault();

			const oldScale = stage.scaleX();
			const pointer = stage.getPointerPosition();

			const mousePointTo = {
				x: (pointer.x - stage.x()) / oldScale,
				y: (pointer.y - stage.y()) / oldScale
			};

			const direction = e.evt.deltaY > 0 ? -1 : 1;
			const scaleBy = 1.1;
			const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
			const clampedScale = Math.max(0.1, Math.min(10, newScale));

			stage.scale({ x: clampedScale, y: clampedScale });

			const newPos = {
				x: pointer.x - mousePointTo.x * clampedScale,
				y: pointer.y - mousePointTo.y * clampedScale
			};
			stage.position(newPos);

			uiState.setZoom(clampedScale);
			uiState.setPan(newPos.x, newPos.y);
		});

		stage.on('dragend', () => {
			const pos = stage.position();
			uiState.setPan(pos.x, pos.y);
		});

		// Resize observer
		const resizeObserver = new ResizeObserver(() => {
			if (stage && containerDiv) {
				stage.width(containerDiv.clientWidth);
				stage.height(containerDiv.clientHeight);
				updateCanvas();
			}
		});
		resizeObserver.observe(containerDiv);

		updateCanvas();
	}

	async function updateCanvas() {
		if (!stage || !layer || !Konva) return;

		const perfStart = performance.now();
		console.log('[PreviewCanvas] === COMPOSITING START ===');
		console.log('[PreviewCanvas] Input:', {
			source1: $projectState.sources.source1?.fileName,
			source2: $projectState.sources.source2?.fileName,
			maskType: $projectState.mask.type,
			maskPattern: $projectState.mask.patternId,
			maskScale: $projectState.mask.scale,
			maskRotation: $projectState.mask.rotation
		});

		if (!$projectState.sources.source1) {
			layer.destroyChildren();
			compositeImage = null;
			return;
		}

		uiState.setProcessing(true, 'Compositing images...');

		try {
			const source1Config = $projectState.sources.source1;
			const source2Config = $projectState.sources.source2 || source1Config;
			const maskConfig = $projectState.mask;

			// Load images
			const t0 = performance.now();
			const img1 = await loadImage(source1Config.imageData);
			const img2 = await loadImage(source2Config.imageData);
			console.log(`[PreviewCanvas] ⏱️ Image loading: ${(performance.now() - t0).toFixed(1)}ms`);

			console.log('[PreviewCanvas] Images loaded:', {
				source1: { width: img1.width, height: img1.height },
				source2: { width: img2.width, height: img2.height },
				mask: maskConfig
			});

			// Resize images to match if needed (use larger dimensions)
			const targetWidth = Math.max(img1.width, img2.width);
			const targetHeight = Math.max(img1.height, img2.height);

			console.log('[PreviewCanvas] Target dimensions:', { targetWidth, targetHeight });

			// Resize and convert images to ImageData
			const source1Data = imageToImageData(img1, targetWidth, targetHeight, source1Config);
			const source2Data = imageToImageData(img2, targetWidth, targetHeight, source2Config);

			console.log('[PreviewCanvas] ImageData created:', {
				source1: { width: source1Data.width, height: source1Data.height },
				source2: { width: source2Data.width, height: source2Data.height }
			});

			// Generate or get mask based on type
			const { generatePatternMask } = await import('$lib/core/patterns');
			const { compositeImages } = await import('$lib/core/compositor');

			let maskCanvas: HTMLCanvasElement | null = null;

			if (maskConfig.type === 'pattern') {
				// Generate pattern mask (with scale for density on infinite patterns)
				const patternId = maskConfig.patternId || 'half-vertical';
				maskCanvas = generatePatternMask(
					patternId as any,
					source1Data.width,
					source1Data.height,
					maskConfig.scale
				);
			} else if (maskConfig.type === 'drawn' && maskConfig.drawnData) {
				// Load drawn mask
				maskCanvas = await loadMaskImage(maskConfig.drawnData, source1Data.width, source1Data.height);
			} else if (maskConfig.type === 'upload' && maskConfig.imageData) {
				// Load uploaded mask image
				maskCanvas = await loadMaskImage(maskConfig.imageData, source1Data.width, source1Data.height);
			} else {
				// Fallback to default pattern
				maskCanvas = generatePatternMask('half-vertical', source1Data.width, source1Data.height, maskConfig.scale);
			}

			if (!maskCanvas) {
				console.error('[PreviewCanvas] Failed to generate/load mask');
				return;
			}

			// Apply scale and rotation transforms to mask
			const transformedMaskCanvas = transformMask(
				maskCanvas,
				maskConfig.scale,
				maskConfig.rotation,
				source1Data.width,
				source1Data.height
			);

			const maskData = canvasToImageData(transformedMaskCanvas);

			// Composite the images using the mask
			console.log('[PreviewCanvas] Compositing with mask:', {
				type: maskConfig.type,
				pattern: maskConfig.patternId,
				invert: maskConfig.invert,
				scale: maskConfig.scale,
				rotation: maskConfig.rotation,
				dimensions: { width: source1Data.width, height: source1Data.height }
			});

			const composited = compositeImages(source1Data, source2Data, maskData, {
				invertMask: maskConfig.invert
			});

			// Store for export
			currentComposite = composited;

			// Display the result
			displayComposite(composited);

			console.log('[PreviewCanvas] Canvas updated with composite');
		} catch (error) {
			console.error('[PreviewCanvas] Error updating canvas:', error);
		} finally {
			uiState.setProcessing(false);
		}
	}

	function imageToImageData(img: HTMLImageElement, targetWidth?: number, targetHeight?: number, sourceConfig?: any): ImageData {
		const canvas = document.createElement('canvas');
		const width = targetWidth || img.width;
		const height = targetHeight || img.height;
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

		// Fill with black background first
		ctx.fillStyle = '#000000';
		ctx.fillRect(0, 0, width, height);

		// Save context for transforms
		ctx.save();

		// Apply canvas filters for adjustments
		if (sourceConfig) {
			const filters: string[] = [];

			// Brightness: -100 to 100 -> 0 to 200%
			if (sourceConfig.brightness !== 0) {
				const bright = 100 + sourceConfig.brightness; // -100 to 100 -> 0 to 200
				filters.push(`brightness(${bright}%)`);
			}

			// Contrast: -100 to 100 -> 0 to 200%
			if (sourceConfig.contrast !== 0) {
				const contrast = 100 + sourceConfig.contrast;
				filters.push(`contrast(${contrast}%)`);
			}

			// Saturation: -100 to 100 -> 0 to 200%
			if (sourceConfig.saturation !== 0) {
				const sat = 100 + sourceConfig.saturation;
				filters.push(`saturate(${sat}%)`);
			}

			// Invert colors
			if (sourceConfig.invertColors) {
				filters.push('invert(100%)');
			}

			if (filters.length > 0) {
				ctx.filter = filters.join(' ');
			}
		}

		// Calculate scaling
		const userScale = sourceConfig ? sourceConfig.scale / 100 : 1;
		const fitScale = Math.min(width / img.width, height / img.height);
		const combinedScale = fitScale * userScale;
		const scaledWidth = img.width * combinedScale;
		const scaledHeight = img.height * combinedScale;

		// Calculate position offsets (as percentage of canvas size)
		const offsetXPx = sourceConfig ? (sourceConfig.positionX / 100) * width : 0;
		const offsetYPx = sourceConfig ? (sourceConfig.positionY / 100) * height : 0;

		// If position offset is used, tile the image for wrap/rollover effect
		if (sourceConfig && (sourceConfig.positionX !== 0 || sourceConfig.positionY !== 0)) {
			// Wrap offset within scaled image bounds
			const wrapX = ((offsetXPx % scaledWidth) + scaledWidth) % scaledWidth;
			const wrapY = ((offsetYPx % scaledHeight) + scaledHeight) % scaledHeight;

			// Calculate how many tiles needed to cover canvas
			const startX = Math.floor(-wrapX / scaledWidth) - 1;
			const endX = Math.ceil((width - wrapX) / scaledWidth) + 1;
			const startY = Math.floor(-wrapY / scaledHeight) - 1;
			const endY = Math.ceil((height - wrapY) / scaledHeight) + 1;

			// Draw tiled pattern
			for (let ty = startY; ty <= endY; ty++) {
				for (let tx = startX; tx <= endX; tx++) {
					const x = tx * scaledWidth + wrapX;
					const y = ty * scaledHeight + wrapY;
					ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
				}
			}
		} else {
			// No offset - draw single centered image
			const centerX = (width - scaledWidth) / 2;
			const centerY = (height - scaledHeight) / 2;
			ctx.drawImage(img, centerX, centerY, scaledWidth, scaledHeight);
		}

		ctx.restore();
		return ctx.getImageData(0, 0, width, height);
	}

	function canvasToImageData(canvas: HTMLCanvasElement): ImageData {
		const ctx = canvas.getContext('2d')!;
		return ctx.getImageData(0, 0, canvas.width, canvas.height);
	}

	function transformMask(
		sourceCanvas: HTMLCanvasElement,
		scale: number,
		rotation: number,
		targetWidth: number,
		targetHeight: number
	): HTMLCanvasElement {
		const canvas = document.createElement('canvas');
		canvas.width = targetWidth;
		canvas.height = targetHeight;
		const ctx = canvas.getContext('2d')!;

		// Fill with black (default mask background)
		ctx.fillStyle = '#000000';
		ctx.fillRect(0, 0, targetWidth, targetHeight);

		// Save context state
		ctx.save();

		// Move to center for rotation and scaling
		ctx.translate(targetWidth / 2, targetHeight / 2);

		// Apply rotation (convert degrees to radians)
		ctx.rotate((rotation * Math.PI) / 180);

		// Apply scale (scale is in percentage, 100% = 1.0)
		const scaleValue = scale / 100;
		ctx.scale(scaleValue, scaleValue);

		// Draw the source mask centered
		ctx.drawImage(
			sourceCanvas,
			-sourceCanvas.width / 2,
			-sourceCanvas.height / 2,
			sourceCanvas.width,
			sourceCanvas.height
		);

		// Restore context state
		ctx.restore();

		return canvas;
	}

	function applyFilters(konvaImage: any, source: any) {
		if (!source || !Konva) return;

		const filters: any[] = [];

		if (source.rotation !== 0) {
			konvaImage.rotation(source.rotation);
		}

		if (source.brightness !== 0) {
			filters.push(Konva.Filters.Brighten);
			konvaImage.brightness(source.brightness / 100);
		}

		if (source.contrast !== 0) {
			filters.push(Konva.Filters.Contrast);
			konvaImage.contrast(source.contrast);
		}

		if (source.saturation !== 0) {
			filters.push(Konva.Filters.HSL);
			konvaImage.saturation(source.saturation / 100);
		}

		if (filters.length > 0) {
			konvaImage.filters(filters);
			konvaImage.cache();
		}
	}

	function loadImage(dataUrl: string): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = dataUrl;
		});
	}

	async function loadMaskImage(dataUrl: string, targetWidth: number, targetHeight: number): Promise<HTMLCanvasElement> {
		const img = await loadImage(dataUrl);
		const canvas = document.createElement('canvas');
		canvas.width = targetWidth;
		canvas.height = targetHeight;
		const ctx = canvas.getContext('2d')!;

		// Draw mask image scaled to target size
		ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

		return canvas;
	}

	function displayComposite(imageData: ImageData) {
		if (!stage || !layer || !Konva) return;

		console.log('[PreviewCanvas] Displaying composite:', {
			width: imageData.width,
			height: imageData.height
		});

		// Clear old content only right before displaying new composite
		layer.destroyChildren();
		compositeImage = null;

		// Convert ImageData to canvas
		const canvas = document.createElement('canvas');
		canvas.width = imageData.width;
		canvas.height = imageData.height;
		const ctx = canvas.getContext('2d')!;
		ctx.putImageData(imageData, 0, 0);

		// Calculate scale to fit the stage
		const maxDim = Math.max(imageData.width, imageData.height);
		const stageDim = Math.min(stage.width(), stage.height()) * 0.8;
		const scale = stageDim / maxDim;

		console.log('[PreviewCanvas] Display scale:', scale);

		const konvaImg = new Konva.Image({
			image: canvas,
			x: stage.width() / 2 - (imageData.width * scale) / 2,
			y: stage.height() / 2 - (imageData.height * scale) / 2,
			scaleX: scale,
			scaleY: scale
		});

		layer.add(konvaImg);
		layer.batchDraw();

		console.log('[PreviewCanvas] Composite displayed on stage');
	}

	// Debounced canvas update for smooth slider interaction
	let updateTimeout: ReturnType<typeof setTimeout> | null = null;
	function debouncedUpdateCanvas() {
		if (updateTimeout) clearTimeout(updateTimeout);
		updateTimeout = setTimeout(() => {
			updateCanvas();
		}, 150); // 150ms debounce for smooth slider movement
	}

	// React to state changes
	$effect(() => {
		if (!browser) return;
		const state = $projectState;
		if (stage && layer && Konva) {
			console.log('[PreviewCanvas] State changed, debouncing update...');
			debouncedUpdateCanvas();
		}
	});

	// Handle export requests
	$effect(() => {
		const exportRequest = $exportTrigger;
		if (exportRequest && currentComposite) {
			console.log('[PreviewCanvas] Export requested, scale:', exportRequest.scale);

			const filename = getDefaultExportFilename();
			exportImage(currentComposite, filename, { scale: exportRequest.scale })
				.then(() => {
					console.log('[PreviewCanvas] Export complete:', filename);
					exportTrigger.clear();
				})
				.catch((err) => {
					console.error('[PreviewCanvas] Export failed:', err);
					alert(`Export failed: ${err.message}`);
					exportTrigger.clear();
				});
		} else if (exportRequest && !currentComposite) {
			alert('No composite available to export. Load images first.');
			exportTrigger.clear();
		}
	});
</script>

<div class="preview-wrapper">
	<div class="preview-canvas" bind:this={containerDiv}></div>

	{#if $uiState.zoom !== 1}
		<div class="zoom-indicator">
			{Math.round($uiState.zoom * 100)}%
		</div>
	{/if}

	{#if $uiState.isProcessing}
		<div class="processing-bar">
			<div class="spinner"></div>
			<span>{$uiState.statusMessage || 'Processing...'}</span>
		</div>
	{/if}
</div>

<style>
	.preview-wrapper {
		width: 100%;
		height: 100%;
		position: relative;
		cursor: grab;
	}

	.preview-wrapper:active {
		cursor: grabbing;
	}

	.preview-canvas {
		width: 100%;
		height: 100%;
		position: relative;
	}

	:global(.preview-canvas canvas) {
		display: block;
	}

	.zoom-indicator {
		position: absolute;
		bottom: var(--spacing-md);
		right: var(--spacing-md);
		padding: var(--spacing-xs) var(--spacing-sm);
		background: rgba(0, 0, 0, 0.7);
		color: var(--color-text-primary);
		font-size: var(--font-size-xs);
		border-radius: var(--radius-sm);
		pointer-events: none;
		backdrop-filter: blur(4px);
	}

	.processing-bar {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm) var(--spacing-md);
		background: rgba(0, 0, 0, 0.85);
		color: var(--color-text-primary);
		font-size: var(--font-size-sm);
		pointer-events: none;
		backdrop-filter: blur(8px);
		z-index: 10;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid var(--color-bg-tertiary);
		border-top-color: var(--color-accent);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
