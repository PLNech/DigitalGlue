<script lang="ts">
	import { exportImage, getDefaultExportFilename } from '$lib/io/export';

	interface ExportDialogProps {
		imageData: ImageData;
		onClose: () => void;
	}

	let { imageData, onClose }: ExportDialogProps = $props();

	let scale = $state(1);
	let format = $state<'png' | 'jpeg'>('png');
	let quality = $state(95);

	// Calculate export dimensions
	let exportWidth = $derived(Math.round(imageData.width * scale));
	let exportHeight = $derived(Math.round(imageData.height * scale));

	// Estimate file size (rough approximation)
	let estimatedSizeMB = $derived.by(() => {
		const pixels = exportWidth * exportHeight;
		if (format === 'png') {
			// PNG is roughly 3-4 bytes per pixel (with compression)
			return ((pixels * 3.5) / (1024 * 1024)).toFixed(1);
		} else {
			// JPEG depends on quality
			const bytesPerPixel = (quality / 100) * 0.5 + 0.1;
			return ((pixels * bytesPerPixel) / (1024 * 1024)).toFixed(1);
		}
	});

	async function handleExport() {
		try {
			const filename = getDefaultExportFilename();
			await exportImage(imageData, filename, { scale, format, quality: quality / 100 });
			onClose();
		} catch (err) {
			alert(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
		}
	}

	// Generate preview (small version)
	let previewDataUrl = $state('');
	$effect(() => {
		const canvas = document.createElement('canvas');
		const maxPreviewSize = 200;
		const previewScale = Math.min(maxPreviewSize / imageData.width, maxPreviewSize / imageData.height);

		canvas.width = Math.round(imageData.width * previewScale);
		canvas.height = Math.round(imageData.height * previewScale);

		const ctx = canvas.getContext('2d')!;
		const tempCanvas = document.createElement('canvas');
		tempCanvas.width = imageData.width;
		tempCanvas.height = imageData.height;
		const tempCtx = tempCanvas.getContext('2d')!;
		tempCtx.putImageData(imageData, 0, 0);

		ctx.imageSmoothingEnabled = true;
		ctx.imageSmoothingQuality = 'high';
		ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);

		previewDataUrl = canvas.toDataURL();
	});

	const scaleOptions = [
		{ value: 0.5, label: '0.5x (Half)' },
		{ value: 1, label: '1x (Original)' },
		{ value: 2, label: '2x (Double)' },
		{ value: 3, label: '3x (Triple)' },
		{ value: 4, label: '4x (Quadruple)' }
	];
</script>

<div class="dialog-backdrop" onclick={onClose} role="presentation"></div>

<div class="export-dialog" role="dialog" aria-labelledby="export-title">
	<div class="dialog-header">
		<h2 id="export-title">Export Image</h2>
		<button class="close-btn" onclick={onClose} aria-label="Close">×</button>
	</div>

	<div class="dialog-content">
		<!-- Preview -->
		<div class="preview-section">
			<div class="preview-label">Preview</div>
			{#if previewDataUrl}
				<img src={previewDataUrl} alt="Export preview" class="preview-image" />
			{/if}
		</div>

		<!-- Export Options -->
		<div class="options-section">
			<!-- Scale -->
			<div class="option-group">
				<label for="scale-select">Scale</label>
				<select id="scale-select" bind:value={scale}>
					{#each scaleOptions as option}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			</div>

			<!-- Format -->
			<div class="option-group">
				<label for="format-select">Format</label>
				<select id="format-select" bind:value={format}>
					<option value="png">PNG (Lossless)</option>
					<option value="jpeg">JPEG (Lossy)</option>
				</select>
			</div>

			<!-- Quality (only for JPEG) -->
			{#if format === 'jpeg'}
				<div class="option-group">
					<label for="quality-slider">
						Quality
						<span class="value">{quality}%</span>
					</label>
					<input
						id="quality-slider"
						type="range"
						min="50"
						max="100"
						bind:value={quality}
						class="slider"
					/>
				</div>
			{/if}

			<!-- Export Info -->
			<div class="export-info">
				<div class="info-row">
					<span class="info-label">Dimensions:</span>
					<span class="info-value">{exportWidth} × {exportHeight}px</span>
				</div>
				<div class="info-row">
					<span class="info-label">Estimated Size:</span>
					<span class="info-value">~{estimatedSizeMB} MB</span>
				</div>
			</div>
		</div>
	</div>

	<div class="dialog-footer">
		<button class="btn btn-secondary" onclick={onClose}>Cancel</button>
		<button class="btn btn-primary" onclick={handleExport}>Export</button>
	</div>
</div>

<style>
	.dialog-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(4px);
		z-index: 1000;
	}

	.export-dialog {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 90%;
		max-width: 500px;
		background: var(--color-bg-panel);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
		z-index: 1001;
		display: flex;
		flex-direction: column;
		max-height: 90vh;
	}

	.dialog-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-lg);
		border-bottom: 1px solid var(--color-border);
	}

	.dialog-header h2 {
		margin: 0;
		font-size: var(--font-size-lg);
		font-weight: 600;
	}

	.close-btn {
		width: 32px;
		height: 32px;
		border-radius: var(--radius-sm);
		font-size: 24px;
		line-height: 1;
		color: var(--color-text-secondary);
		transition: all var(--transition-fast);
	}

	.close-btn:hover {
		background: var(--color-bg-hover);
		color: var(--color-text-primary);
	}

	.dialog-content {
		padding: var(--spacing-lg);
		overflow-y: auto;
		display: flex;
		gap: var(--spacing-lg);
	}

	.preview-section {
		flex: 0 0 200px;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.preview-label {
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--color-text-secondary);
	}

	.preview-image {
		width: 200px;
		height: 200px;
		object-fit: contain;
		background: var(--color-bg-tertiary);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	.options-section {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.option-group {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.option-group label {
		font-size: var(--font-size-sm);
		font-weight: 500;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.option-group .value {
		color: var(--color-text-secondary);
		font-weight: 400;
	}

	.option-group select {
		padding: var(--spacing-sm);
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text-primary);
		font-size: var(--font-size-sm);
	}

	.slider {
		width: 100%;
	}

	.export-info {
		margin-top: var(--spacing-md);
		padding: var(--spacing-md);
		background: var(--color-bg-secondary);
		border-radius: var(--radius-md);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		font-size: var(--font-size-sm);
	}

	.info-label {
		color: var(--color-text-secondary);
	}

	.info-value {
		font-weight: 500;
	}

	.dialog-footer {
		padding: var(--spacing-lg);
		border-top: 1px solid var(--color-border);
		display: flex;
		gap: var(--spacing-sm);
		justify-content: flex-end;
	}

	.btn {
		padding: var(--spacing-sm) var(--spacing-lg);
		border-radius: var(--radius-sm);
		font-size: var(--font-size-sm);
		font-weight: 500;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.btn-secondary {
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
	}

	.btn-secondary:hover {
		background: var(--color-bg-hover);
	}

	.btn-primary {
		background: var(--color-accent);
		color: white;
		border: none;
	}

	.btn-primary:hover {
		background: var(--color-accent-hover);
	}
</style>
