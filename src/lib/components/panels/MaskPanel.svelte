<script lang="ts">
	import { projectState } from '$state/project';
	import { historyStore } from '$state/history';
	import Panel from './Panel.svelte';

	type MaskTab = 'upload' | 'patterns' | 'draw';
	let activeTab = $state<MaskTab>('patterns');

	// Built-in patterns
	const patterns = [
		{ id: 'half-vertical', name: 'Half Vertical', preview: '◧' },
		{ id: 'half-horizontal', name: 'Half Horizontal', preview: '⬒' },
		{ id: 'diagonal', name: 'Diagonal', preview: '◪' },
		{ id: 'circle', name: 'Circle', preview: '◯' },
		{ id: 'diamond', name: 'Diamond', preview: '◇' },
		{ id: 'stripes-v', name: 'Vertical Stripes', preview: '║' },
		{ id: 'stripes-h', name: 'Horizontal Stripes', preview: '═' },
		{ id: 'checkerboard', name: 'Checkerboard', preview: '▦' }
	];

	function selectPattern(patternId: string) {
		projectState.updateMask({
			type: 'pattern',
			patternId
		});
		historyStore.snapshot(`Select pattern: ${patternId}`);
	}

	function toggleInvert() {
		projectState.updateMask({
			invert: !$projectState.mask.invert
		});
		historyStore.snapshot('Toggle mask invert');
	}

	let fileInput: HTMLInputElement;

	async function handleMaskUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		if (!file) return;

		const reader = new FileReader();
		reader.onload = () => {
			projectState.updateMask({
				type: 'upload',
				imageData: reader.result as string
			});
			historyStore.snapshot('Upload mask');
		};
		reader.readAsDataURL(file);
	}
</script>

<Panel title="Mask" panelId="mask">
	<!-- Tab Navigation -->
	<div class="mask-tabs">
		<button
			class="tab-btn"
			class:active={activeTab === 'upload'}
			onclick={() => (activeTab = 'upload')}
		>
			Upload
		</button>
		<button
			class="tab-btn"
			class:active={activeTab === 'patterns'}
			onclick={() => (activeTab = 'patterns')}
		>
			Patterns
		</button>
		<button
			class="tab-btn"
			class:active={activeTab === 'draw'}
			onclick={() => (activeTab = 'draw')}
		>
			Draw
		</button>
	</div>

	<!-- Tab Content -->
	<div class="tab-content">
		{#if activeTab === 'upload'}
			<div class="upload-section">
				<button class="upload-btn" onclick={() => fileInput.click()}>
					Choose Image as Mask
				</button>
				<input
					type="file"
					accept="image/*"
					bind:this={fileInput}
					onchange={handleMaskUpload}
					hidden
				/>

				{#if $projectState.mask.type === 'upload' && $projectState.mask.imageData}
					<div class="mask-preview">
						<img src={$projectState.mask.imageData} alt="Mask" class="preview-img" />
					</div>
				{/if}

				<div class="threshold-control">
					<label class="control-label">
						<span>Threshold</span>
						<span class="control-value">{$projectState.mask.threshold}</span>
					</label>
					<input
						type="range"
						min="0"
						max="255"
						value={$projectState.mask.threshold}
						oninput={(e) =>
							projectState.updateMask({ threshold: parseInt(e.currentTarget.value) })}
						class="slider"
					/>
				</div>
			</div>
		{:else if activeTab === 'patterns'}
			<div class="patterns-grid">
				{#each patterns as pattern}
					<button
						class="pattern-btn"
						class:selected={$projectState.mask.patternId === pattern.id}
						onclick={() => selectPattern(pattern.id)}
						title={pattern.name}
					>
						<span class="pattern-icon">{pattern.preview}</span>
						<span class="pattern-name">{pattern.name}</span>
					</button>
				{/each}
			</div>
		{:else if activeTab === 'draw'}
			<div class="draw-section">
				<p class="placeholder-text">
					Mask drawing tools coming soon!
				</p>
				<div class="draw-tools-preview">
					<span title="Brush">🖌️</span>
					<span title="Eraser">🧹</span>
					<span title="Line">📏</span>
					<span title="Rectangle">▢</span>
					<span title="Ellipse">○</span>
					<span title="Fill">🪣</span>
				</div>
			</div>
		{/if}
	</div>

	<!-- Invert Toggle (always visible) -->
	<div class="mask-options">
		<label class="checkbox-label">
			<input
				type="checkbox"
				checked={$projectState.mask.invert}
				onchange={toggleInvert}
			/>
			<span>Invert Mask</span>
		</label>
	</div>
</Panel>

<style>
	.mask-tabs {
		display: flex;
		gap: 2px;
		margin-bottom: var(--spacing-md);
		background: var(--color-bg-primary);
		border-radius: var(--radius-sm);
		padding: 2px;
	}

	.tab-btn {
		flex: 1;
		padding: var(--spacing-xs) var(--spacing-sm);
		font-size: var(--font-size-xs);
		border-radius: var(--radius-sm);
		color: var(--color-text-secondary);
		transition: all var(--transition-fast);
	}

	.tab-btn:hover {
		color: var(--color-text-primary);
	}

	.tab-btn.active {
		background: var(--color-bg-active);
		color: var(--color-text-primary);
	}

	.tab-content {
		margin-bottom: var(--spacing-md);
	}

	.upload-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.upload-btn {
		padding: var(--spacing-sm) var(--spacing-md);
		background: var(--color-bg-tertiary);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-size: var(--font-size-sm);
	}

	.upload-btn:hover {
		background: var(--color-bg-active);
	}

	.mask-preview {
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.preview-img {
		width: 100%;
		height: 100px;
		object-fit: contain;
		background: var(--color-bg-primary);
	}

	.patterns-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--spacing-sm);
	}

	.pattern-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-sm);
		background: var(--color-bg-primary);
		border: 2px solid transparent;
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}

	.pattern-btn:hover {
		background: var(--color-bg-hover);
	}

	.pattern-btn.selected {
		border-color: var(--color-accent);
		background: var(--color-bg-active);
	}

	.pattern-icon {
		font-size: 24px;
	}

	.pattern-name {
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
	}

	.draw-section {
		text-align: center;
		padding: var(--spacing-md);
	}

	.placeholder-text {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		margin-bottom: var(--spacing-md);
	}

	.draw-tools-preview {
		display: flex;
		justify-content: center;
		gap: var(--spacing-md);
		font-size: 20px;
		opacity: 0.5;
	}

	.threshold-control {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.control-label {
		display: flex;
		justify-content: space-between;
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
	}

	.control-value {
		color: var(--color-text-primary);
	}

	.slider {
		width: 100%;
		height: 4px;
		appearance: none;
		background: var(--color-bg-primary);
		border-radius: 2px;
		cursor: pointer;
	}

	.slider::-webkit-slider-thumb {
		appearance: none;
		width: 14px;
		height: 14px;
		background: var(--color-accent);
		border-radius: 50%;
		cursor: pointer;
	}

	.mask-options {
		padding-top: var(--spacing-md);
		border-top: 1px solid var(--color-border);
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		font-size: var(--font-size-sm);
		cursor: pointer;
	}

	.checkbox-label input {
		width: 16px;
		height: 16px;
		accent-color: var(--color-accent);
	}
</style>
