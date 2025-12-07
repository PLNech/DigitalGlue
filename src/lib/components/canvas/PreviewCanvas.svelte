<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { projectState } from '$state/project';
	import { uiState } from '$state/ui';

	let containerDiv: HTMLDivElement;
	let Konva: typeof import('konva').default | null = null;
	let stage: any = null;
	let layer: any = null;
	let source1Image: any = null;
	let source2Image: any = null;
	let maskShape: any = null;

	onMount(async () => {
		console.log('[PreviewCanvas] Mounting...');
		if (browser) {
			// Dynamically import Konva only on client side
			const konvaModule = await import('konva');
			Konva = konvaModule.default;
			console.log('[PreviewCanvas] Konva loaded');
			initializeStage();
		}
	});

	onDestroy(() => {
		console.log('[PreviewCanvas] Destroying...');
		stage?.destroy();
	});

	function initializeStage() {
		if (!containerDiv || !Konva) {
			console.log('[PreviewCanvas] Cannot initialize - missing container or Konva');
			return;
		}

		console.log('[PreviewCanvas] Initializing Konva stage');
		const width = containerDiv.clientWidth;
		const height = containerDiv.clientHeight;

		stage = new Konva.Stage({
			container: containerDiv,
			width,
			height
		});

		layer = new Konva.Layer();
		stage.add(layer);

		// Add resize observer
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

	function updateCanvas() {
		if (!stage || !layer || !Konva) {
			console.log('[PreviewCanvas] Cannot update - missing stage, layer, or Konva');
			return;
		}

		console.log('[PreviewCanvas] Updating canvas', {
			hasSource1: !!$projectState.sources.source1,
			hasSource2: !!$projectState.sources.source2
		});

		// Clear existing
		layer.destroyChildren();
		source1Image = null;
		source2Image = null;
		maskShape = null;

		// If we have source1, render it
		if ($projectState.sources.source1) {
			const img1 = new window.Image();
			img1.onload = () => {
				console.log('[PreviewCanvas] Source 1 image loaded');
				const konvaImg1 = new Konva!.Image({
					image: img1,
					x: 0,
					y: 0,
					width: stage!.width(),
					height: stage!.height()
				});

				// Fit image to stage
				const scale = Math.min(
					stage!.width() / img1.width,
					stage!.height() / img1.height
				);
				konvaImg1.scale({ x: scale, y: scale });
				konvaImg1.x((stage!.width() - img1.width * scale) / 2);
				konvaImg1.y((stage!.height() - img1.height * scale) / 2);

				source1Image = konvaImg1;
				layer!.add(konvaImg1);

				// If we have source2, composite it
				if ($projectState.sources.source2) {
					const img2 = new window.Image();
					img2.onload = () => {
						console.log('[PreviewCanvas] Source 2 image loaded');
						const konvaImg2 = new Konva!.Image({
							image: img2,
							x: 0,
							y: 0,
							width: stage!.width(),
							height: stage!.height()
						});

						// Same scaling
						konvaImg2.scale({ x: scale, y: scale });
						konvaImg2.x((stage!.width() - img2.width * scale) / 2);
						konvaImg2.y((stage!.height() - img2.height * scale) / 2);

						// Simple mask preview - vertical split for now
						konvaImg2.clip({
							x: stage!.width() / 2,
							y: 0,
							width: stage!.width() / 2,
							height: stage!.height()
						});

						source2Image = konvaImg2;
						layer!.add(konvaImg2);
						layer!.batchDraw();
					};
					img2.src = $projectState.sources.source2.imageData;
				} else {
					layer!.batchDraw();
				}
			};
			img1.src = $projectState.sources.source1.imageData;
		}
	}

	// React to state changes (only on client)
	$effect(() => {
		if (!browser) return;
		const state = $projectState;
		if (stage && layer && Konva) {
			console.log('[PreviewCanvas] State changed, updating...');
			updateCanvas();
		}
	});

	// Handle zoom/pan (only on client)
	$effect(() => {
		if (!browser) return;
		if (stage) {
			stage.scale({ x: $uiState.zoom, y: $uiState.zoom });
			stage.position({ x: $uiState.panX, y: $uiState.panY });
			stage.batchDraw();
		}
	});
</script>

<div class="preview-canvas" bind:this={containerDiv}></div>

<style>
	.preview-canvas {
		width: 100%;
		height: 100%;
		position: relative;
	}

	:global(.preview-canvas canvas) {
		display: block;
	}
</style>
