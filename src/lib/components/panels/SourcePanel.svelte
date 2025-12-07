<script lang="ts">
	import { projectState, hasSource1, hasSource2, isSingleSourceMode } from '$state/project';
	import { uiState } from '$state/ui';
	import { historyStore } from '$state/history';
	import Panel from './Panel.svelte';

	let fileInput1: HTMLInputElement;
	let fileInput2: HTMLInputElement;

	async function handleFileSelect(event: Event, sourceNum: 1 | 2) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		console.log(`[SourcePanel] File selected for source${sourceNum}:`, file?.name);

		if (!file) return;

		// Validate file type
		if (!file.type.startsWith('image/')) {
			alert('Please select an image file');
			return;
		}

		uiState.setProcessing(true, 'Loading image...');

		try {
			const imageData = await fileToDataURL(file);
			console.log(`[SourcePanel] Image data URL created, length: ${imageData.length}`);

			const dimensions = await getImageDimensions(imageData);
			console.log(`[SourcePanel] Image dimensions: ${dimensions.width}x${dimensions.height}`);

			const sourceConfig = {
				imageData,
				fileName: file.name,
				width: dimensions.width,
				height: dimensions.height,
				rotation: 0,
				brightness: 0,
				contrast: 0,
				saturation: 0,
				invertColors: false
			};

			if (sourceNum === 1) {
				console.log('[SourcePanel] Setting source 1');
				projectState.setSource1(sourceConfig);
			} else {
				console.log('[SourcePanel] Setting source 2');
				projectState.setSource2(sourceConfig);
			}

			historyStore.snapshot(`Load ${sourceNum === 1 ? 'Source 1' : 'Source 2'}`);
			console.log(`[SourcePanel] Source ${sourceNum} loaded successfully`);
		} catch (error) {
			console.error('[SourcePanel] Failed to load image:', error);
			alert('Failed to load image');
		} finally {
			uiState.setProcessing(false);
		}
	}

	function fileToDataURL(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
	}

	function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
			img.onerror = reject;
			img.src = dataUrl;
		});
	}

	function clearSource(sourceNum: 1 | 2) {
		if (sourceNum === 1) {
			projectState.setSource1(null);
		} else {
			projectState.setSource2(null);
		}
		historyStore.snapshot(`Clear ${sourceNum === 1 ? 'Source 1' : 'Source 2'}`);
	}
</script>

<Panel title="Sources" panelId="source">
	<div class="source-slots">
		<!-- Source 1 -->
		<div class="source-slot">
			<div class="source-header">
				<span class="source-label">Source 1</span>
				{#if $hasSource1}
					<button class="clear-btn" onclick={() => clearSource(1)} title="Clear">×</button>
				{/if}
			</div>

			{#if $hasSource1 && $projectState.sources.source1}
				<div class="source-preview">
					<img
						src={$projectState.sources.source1.imageData}
						alt="Source 1"
						class="preview-image"
					/>
					<div class="source-info">
						<span class="filename">{$projectState.sources.source1.fileName}</span>
						<span class="dimensions">
							{$projectState.sources.source1.width} × {$projectState.sources.source1.height}
						</span>
					</div>
				</div>
			{:else}
				<button class="drop-zone" onclick={() => fileInput1.click()}>
					<span class="drop-icon">+</span>
					<span class="drop-text">Click to load</span>
				</button>
			{/if}

			<input
				type="file"
				accept="image/*"
				bind:this={fileInput1}
				onchange={(e) => handleFileSelect(e, 1)}
				hidden
			/>
		</div>

		<!-- Source 2 -->
		<div class="source-slot" class:disabled={!$hasSource1}>
			<div class="source-header">
				<span class="source-label">Source 2</span>
				{#if $isSingleSourceMode}
					<span class="mode-badge">Clone Mode</span>
				{/if}
				{#if $hasSource2}
					<button class="clear-btn" onclick={() => clearSource(2)} title="Clear">×</button>
				{/if}
			</div>

			{#if $hasSource2 && $projectState.sources.source2}
				<div class="source-preview">
					<img
						src={$projectState.sources.source2.imageData}
						alt="Source 2"
						class="preview-image"
					/>
					<div class="source-info">
						<span class="filename">{$projectState.sources.source2.fileName}</span>
						<span class="dimensions">
							{$projectState.sources.source2.width} × {$projectState.sources.source2.height}
						</span>
					</div>
				</div>
			{:else if $hasSource1}
				<button class="drop-zone" onclick={() => fileInput2.click()}>
					<span class="drop-icon">+</span>
					<span class="drop-text">Add second source</span>
					<span class="drop-hint">or use clone mode</span>
				</button>
			{:else}
				<div class="drop-zone disabled">
					<span class="drop-text">Load Source 1 first</span>
				</div>
			{/if}

			<input
				type="file"
				accept="image/*"
				bind:this={fileInput2}
				onchange={(e) => handleFileSelect(e, 2)}
				hidden
			/>
		</div>
	</div>
</Panel>

<style>
	.source-slots {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.source-slot {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.source-slot.disabled {
		opacity: 0.5;
	}

	.source-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.source-label {
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--color-text-secondary);
	}

	.mode-badge {
		font-size: var(--font-size-xs);
		padding: 2px 6px;
		background: var(--color-accent);
		color: white;
		border-radius: var(--radius-sm);
		margin-left: auto;
	}

	.clear-btn {
		margin-left: auto;
		width: 20px;
		height: 20px;
		font-size: 14px;
		color: var(--color-text-muted);
		border-radius: var(--radius-sm);
	}

	.clear-btn:hover {
		background: var(--color-error);
		color: white;
	}

	.source-preview {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
		background: var(--color-bg-primary);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.preview-image {
		width: 100%;
		height: 120px;
		object-fit: cover;
	}

	.source-info {
		display: flex;
		flex-direction: column;
		padding: var(--spacing-sm);
		gap: 2px;
	}

	.filename {
		font-size: var(--font-size-xs);
		color: var(--color-text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.dimensions {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}

	.drop-zone {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-xs);
		height: 100px;
		border: 2px dashed var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-bg-primary);
		cursor: pointer;
		transition: border-color var(--transition-fast), background var(--transition-fast);
	}

	.drop-zone:hover:not(.disabled) {
		border-color: var(--color-accent);
		background: var(--color-bg-hover);
	}

	.drop-zone.disabled {
		cursor: not-allowed;
	}

	.drop-icon {
		font-size: 24px;
		color: var(--color-text-muted);
	}

	.drop-text {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}

	.drop-hint {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}
</style>
