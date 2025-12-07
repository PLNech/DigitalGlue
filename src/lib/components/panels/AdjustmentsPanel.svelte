<script lang="ts">
	import { projectState, hasSource1, hasSource2, isSingleSourceMode } from '$state/project';
	import { historyStore } from '$state/history';
	import Panel from './Panel.svelte';

	type AdjustmentTarget = 'source1' | 'source2';
	let activeTarget = $state<AdjustmentTarget>('source1');

	function updateAdjustment(
		target: AdjustmentTarget,
		key: 'scale' | 'positionX' | 'positionY' | 'rotation' | 'brightness' | 'contrast' | 'saturation' | 'invertColors',
		value: number | boolean
	) {
		if (target === 'source1') {
			projectState.updateSource1({ [key]: value });
		} else {
			projectState.updateSource2({ [key]: value });
		}
	}

	function resetAdjustments(target: AdjustmentTarget) {
		const defaults = { scale: 100, positionX: 0, positionY: 0, rotation: 0, brightness: 0, contrast: 0, saturation: 0 };
		if (target === 'source1') {
			projectState.updateSource1(defaults);
		} else {
			projectState.updateSource2(defaults);
		}
		historyStore.snapshot(`Reset ${target} adjustments`);
	}

	// Map scale (10-500%) to slider position (0-100)
	// 0-50: maps to 10-100% (left half)
	// 50-100: maps to 100-500% (right half)
	function scaleToSlider(scale: number): number {
		if (scale <= 100) {
			return ((scale - 10) / 90) * 50; // 10-100% -> 0-50
		} else {
			return 50 + ((scale - 100) / 400) * 50; // 100-500% -> 50-100
		}
	}

	function sliderToScale(slider: number): number {
		if (slider <= 50) {
			return Math.round(10 + (slider / 50) * 90); // 0-50 -> 10-100%
		} else {
			return Math.round(100 + ((slider - 50) / 50) * 400); // 50-100 -> 100-500%
		}
	}

	// Get current source config based on active target
	let currentSource = $derived(
		activeTarget === 'source1'
			? $projectState.sources.source1
			: $projectState.sources.source2 ?? $projectState.sources.source1
	);
</script>

<Panel title="Adjustments" panelId="adjustments">
	{#if $hasSource1}
		<!-- Source Toggle (for dual source mode) -->
		{#if !$isSingleSourceMode && $hasSource2}
			<div class="source-toggle">
				<button
					class="toggle-btn"
					class:active={activeTarget === 'source1'}
					onclick={() => (activeTarget = 'source1')}
				>
					Source 1
				</button>
				<button
					class="toggle-btn"
					class:active={activeTarget === 'source2'}
					onclick={() => (activeTarget = 'source2')}
				>
					Source 2
				</button>
			</div>
		{:else if $isSingleSourceMode}
			<div class="source-toggle">
				<button
					class="toggle-btn"
					class:active={activeTarget === 'source1'}
					onclick={() => (activeTarget = 'source1')}
				>
					Original
				</button>
				<button
					class="toggle-btn"
					class:active={activeTarget === 'source2'}
					onclick={() => (activeTarget = 'source2')}
				>
					Clone
				</button>
			</div>
		{/if}

		{#if currentSource}
			<div class="adjustments">
				<!-- Scale -->
				<div class="control-row">
					<label class="control-label">
						<span>Scale</span>
						<span class="control-value">{currentSource.scale}%</span>
					</label>
					<input
						type="range"
						min="0"
						max="100"
						value={scaleToSlider(currentSource.scale)}
						oninput={(e) =>
							updateAdjustment(activeTarget, 'scale', sliderToScale(parseInt(e.currentTarget.value)))}
						class="slider"
					/>
				</div>

				<!-- Position X -->
				<div class="control-row">
					<label class="control-label">
						<span>Position X</span>
						<span class="control-value">{currentSource.positionX}%</span>
					</label>
					<input
						type="range"
						min="-100"
						max="100"
						value={currentSource.positionX}
						oninput={(e) =>
							updateAdjustment(activeTarget, 'positionX', parseInt(e.currentTarget.value))}
						class="slider"
					/>
				</div>

				<!-- Position Y -->
				<div class="control-row">
					<label class="control-label">
						<span>Position Y</span>
						<span class="control-value">{currentSource.positionY}%</span>
					</label>
					<input
						type="range"
						min="-100"
						max="100"
						value={currentSource.positionY}
						oninput={(e) =>
							updateAdjustment(activeTarget, 'positionY', parseInt(e.currentTarget.value))}
						class="slider"
					/>
				</div>

				<!-- Rotation -->
				<div class="control-row">
					<label class="control-label">
						<span>Rotation</span>
						<span class="control-value">{currentSource.rotation}°</span>
					</label>
					<input
						type="range"
						min="-180"
						max="180"
						value={currentSource.rotation}
						oninput={(e) =>
							updateAdjustment(activeTarget, 'rotation', parseInt(e.currentTarget.value))}
						class="slider"
					/>
				</div>

				<!-- Brightness -->
				<div class="control-row">
					<label class="control-label">
						<span>Brightness</span>
						<span class="control-value">{currentSource.brightness}</span>
					</label>
					<input
						type="range"
						min="-100"
						max="100"
						value={currentSource.brightness}
						oninput={(e) =>
							updateAdjustment(activeTarget, 'brightness', parseInt(e.currentTarget.value))}
						class="slider"
					/>
				</div>

				<!-- Contrast -->
				<div class="control-row">
					<label class="control-label">
						<span>Contrast</span>
						<span class="control-value">{currentSource.contrast}</span>
					</label>
					<input
						type="range"
						min="-100"
						max="100"
						value={currentSource.contrast}
						oninput={(e) =>
							updateAdjustment(activeTarget, 'contrast', parseInt(e.currentTarget.value))}
						class="slider"
					/>
				</div>

				<!-- Saturation -->
				<div class="control-row">
					<label class="control-label">
						<span>Saturation</span>
						<span class="control-value">{currentSource.saturation}</span>
					</label>
					<input
						type="range"
						min="-100"
						max="100"
						value={currentSource.saturation}
						oninput={(e) =>
							updateAdjustment(activeTarget, 'saturation', parseInt(e.currentTarget.value))}
						class="slider"
					/>
				</div>

				<!-- Invert Colors Toggle -->
				<div class="control-row">
					<label class="checkbox-label">
						<input
							type="checkbox"
							checked={currentSource.invertColors}
							onchange={(e) =>
								updateAdjustment(activeTarget, 'invertColors', e.currentTarget.checked)}
						/>
						<span>Invert Colors</span>
					</label>
				</div>

				<!-- Reset Button -->
				<button class="reset-btn" onclick={() => resetAdjustments(activeTarget)}>
					Reset Adjustments
				</button>
			</div>
		{/if}
	{:else}
		<p class="empty-message">Load a source image to adjust</p>
	{/if}
</Panel>

<style>
	.source-toggle {
		display: flex;
		gap: 2px;
		margin-bottom: var(--spacing-md);
		background: var(--color-bg-primary);
		border-radius: var(--radius-sm);
		padding: 2px;
	}

	.toggle-btn {
		flex: 1;
		padding: var(--spacing-xs) var(--spacing-sm);
		font-size: var(--font-size-xs);
		border-radius: var(--radius-sm);
		color: var(--color-text-secondary);
		transition: all var(--transition-fast);
	}

	.toggle-btn:hover {
		color: var(--color-text-primary);
	}

	.toggle-btn.active {
		background: var(--color-bg-active);
		color: var(--color-text-primary);
	}

	.adjustments {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.control-row {
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
		min-width: 40px;
		text-align: right;
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

	.reset-btn {
		padding: var(--spacing-sm);
		background: var(--color-bg-tertiary);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-size: var(--font-size-sm);
		margin-top: var(--spacing-sm);
	}

	.reset-btn:hover {
		background: var(--color-bg-active);
	}

	.empty-message {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		text-align: center;
		padding: var(--spacing-lg);
	}
</style>
