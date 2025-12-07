<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { projectState } from '$state/project';
	import { uiState } from '$state/ui';

	let containerDiv: HTMLDivElement;
	let Konva: typeof import('konva').default | null = null;
	let stage: any = null;
	let layer: any = null;
	let compositeImage: any = null;

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

		console.log('[PreviewCanvas] Updating canvas');

		layer.destroyChildren();
		compositeImage = null;

		if (!$projectState.sources.source1) return;

		uiState.setProcessing(true, 'Compositing images...');

		try {
			const source1Config = $projectState.sources.source1;
			const source2Config = $projectState.sources.source2 || source1Config;
			const maskConfig = $projectState.mask;

			// Load images
			const img1 = await loadImage(source1Config.imageData);
			const img2 = await loadImage(source2Config.imageData);

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
			const source1Data = imageToImageData(img1, targetWidth, targetHeight);
			const source2Data = imageToImageData(img2, targetWidth, targetHeight);

			console.log('[PreviewCanvas] ImageData created:', {
				source1: { width: source1Data.width, height: source1Data.height },
				source2: { width: source2Data.width, height: source2Data.height }
			});

			// Generate or get mask
			const { generatePatternMask } = await import('$lib/core/patterns');
			const { compositeImages } = await import('$lib/core/compositor');

			// Use selected pattern or default to half-vertical
			const patternId = maskConfig.patternId || 'half-vertical';
			const maskCanvas = generatePatternMask(
				patternId as any,
				source1Data.width,
				source1Data.height
			);

			if (!maskCanvas) {
				console.error('[PreviewCanvas] Failed to generate mask');
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
				pattern: patternId,
				invert: maskConfig.invert,
				scale: maskConfig.scale,
				rotation: maskConfig.rotation,
				dimensions: { width: source1Data.width, height: source1Data.height }
			});

			const composited = compositeImages(source1Data, source2Data, maskData, {
				invertMask: maskConfig.invert
			});

			// Display the result
			displayComposite(composited);

			console.log('[PreviewCanvas] Canvas updated with composite');
		} catch (error) {
			console.error('[PreviewCanvas] Error updating canvas:', error);
		} finally {
			uiState.setProcessing(false);
		}
	}

	function imageToImageData(img: HTMLImageElement, targetWidth?: number, targetHeight?: number): ImageData {
		const canvas = document.createElement('canvas');
		const width = targetWidth || img.width;
		const height = targetHeight || img.height;
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext('2d')!;

		// Fill with black background first
		ctx.fillStyle = '#000000';
		ctx.fillRect(0, 0, width, height);

		// Draw image centered (maintain aspect ratio)
		const scale = Math.min(width / img.width, height / img.height);
		const scaledWidth = img.width * scale;
		const scaledHeight = img.height * scale;
		const x = (width - scaledWidth) / 2;
		const y = (height - scaledHeight) / 2;

		ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
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

	function displayComposite(imageData: ImageData) {
		if (!stage || !layer || !Konva) return;

		console.log('[PreviewCanvas] Displaying composite:', {
			width: imageData.width,
			height: imageData.height
		});

		layer.destroyChildren();

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

	// React to state changes
	$effect(() => {
		if (!browser) return;
		const state = $projectState;
		if (stage && layer && Konva) {
			console.log('[PreviewCanvas] State changed, updating...');
			updateCanvas();
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
		<div class="processing-indicator">
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

	.processing-indicator {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-lg);
		background: rgba(0, 0, 0, 0.8);
		border-radius: var(--radius-md);
		color: var(--color-text-primary);
		font-size: var(--font-size-sm);
		pointer-events: none;
	}

	.spinner {
		width: 24px;
		height: 24px;
		border: 3px solid var(--color-bg-tertiary);
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
