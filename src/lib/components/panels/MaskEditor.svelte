<script lang="ts">
	import { onMount } from 'svelte';
	import { projectState } from '$state/project';
	import { historyStore } from '$state/history';

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let isDrawing = false;
	let lastX = 0;
	let lastY = 0;

	type Tool = 'brush' | 'eraser';
	let activeTool = $state<Tool>('brush');
	let brushSize = $state(20);

	onMount(() => {
		ctx = canvas.getContext('2d', { willReadFrequently: true });
		if (!ctx) return;

		// Initialize with white background (no mask)
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Load existing drawn mask if any
		if ($projectState.mask.type === 'drawn' && $projectState.mask.drawnData) {
			const img = new Image();
			img.onload = () => {
				ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
			};
			img.src = $projectState.mask.drawnData;
		}
	});

	function startDrawing(e: MouseEvent) {
		if (!ctx) return;
		isDrawing = true;

		const rect = canvas.getBoundingClientRect();
		lastX = ((e.clientX - rect.left) / rect.width) * canvas.width;
		lastY = ((e.clientY - rect.top) / rect.height) * canvas.height;

		// Draw initial dot at starting position
		ctx.beginPath();
		ctx.arc(lastX, lastY, brushSize / 2, 0, Math.PI * 2);
		ctx.fillStyle = activeTool === 'brush' ? '#000000' : '#ffffff';
		ctx.fill();
	}

	function stopDrawing() {
		if (!isDrawing) return;
		isDrawing = false;
		saveMask();
	}

	function draw(e: MouseEvent) {
		if (!isDrawing || !ctx) return;

		const rect = canvas.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
		const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

		// Draw line from last position to current position
		ctx.beginPath();
		ctx.moveTo(lastX, lastY);
		ctx.lineTo(x, y);
		ctx.strokeStyle = activeTool === 'brush' ? '#000000' : '#ffffff';
		ctx.lineWidth = brushSize;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.stroke();

		// Update last position
		lastX = x;
		lastY = y;
	}

	function clearCanvas() {
		if (!ctx) return;
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		saveMask();
	}

	function fillCanvas() {
		if (!ctx) return;
		ctx.fillStyle = '#000000';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		saveMask();
	}

	function saveMask() {
		if (!canvas) return;
		const dataUrl = canvas.toDataURL('image/png');
		projectState.updateMask({
			type: 'drawn',
			drawnData: dataUrl
		});
		historyStore.snapshot('Draw mask');
	}
</script>

<div class="mask-editor">
	<!-- Drawing Canvas -->
	<div class="canvas-container">
		<canvas
			bind:this={canvas}
			width="512"
			height="512"
			onmousedown={startDrawing}
			onmousemove={draw}
			onmouseup={stopDrawing}
			onmouseleave={stopDrawing}
		></canvas>
	</div>

	<!-- Tools -->
	<div class="tools">
		<div class="tool-buttons">
			<button
				class="tool-btn"
				class:active={activeTool === 'brush'}
				onclick={() => (activeTool = 'brush')}
				title="Brush (draw black)"
			>
				🖌️
			</button>
			<button
				class="tool-btn"
				class:active={activeTool === 'eraser'}
				onclick={() => (activeTool = 'eraser')}
				title="Eraser (draw white)"
			>
				🧹
			</button>
			<button class="tool-btn" onclick={fillCanvas} title="Fill black">
				🪣
			</button>
			<button class="tool-btn" onclick={clearCanvas} title="Clear">
				🗑️
			</button>
		</div>

		<div class="brush-size">
			<label>
				<span>Brush Size: {brushSize}px</span>
				<input type="range" min="1" max="50" bind:value={brushSize} class="slider" />
			</label>
		</div>
	</div>
</div>

<style>
	.mask-editor {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.canvas-container {
		position: relative;
		width: 100%;
		aspect-ratio: 1;
		background: var(--color-bg-tertiary);
		border-radius: var(--radius-md);
		overflow: hidden;
		cursor: crosshair;
	}

	canvas {
		width: 100%;
		height: 100%;
		display: block;
	}

	.tools {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.tool-buttons {
		display: flex;
		gap: var(--spacing-xs);
		justify-content: center;
	}

	.tool-btn {
		width: 40px;
		height: 40px;
		font-size: 20px;
		border-radius: var(--radius-sm);
		background: var(--color-bg-secondary);
		border: 2px solid transparent;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.tool-btn:hover {
		background: var(--color-bg-hover);
	}

	.tool-btn.active {
		border-color: var(--color-accent);
		background: var(--color-bg-hover);
	}

	.brush-size {
		padding: var(--spacing-xs);
	}

	.brush-size label {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
	}

	.slider {
		width: 100%;
	}
</style>
