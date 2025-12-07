<script lang="ts">
	import { projectState, type EffectMode } from '$state/project';
	import { historyStore } from '$state/history';
	import Panel from './Panel.svelte';

	type EffectOption = {
		id: EffectMode;
		name: string;
		description: string;
		icon: string;
	};

	const effects: EffectOption[] = [
		{ id: 'none', name: 'None', description: 'Sharp edges', icon: '▬' },
		{ id: 'soft-feather', name: 'Soft Feather', description: 'Gaussian blur edges', icon: '🌫️' },
		{ id: 'shadow-feather', name: 'Shadow Feather', description: 'Fast hardware blur', icon: '💨' },
		{ id: 'wavy', name: 'Wavy', description: 'Organic distortion', icon: '〰️' },
		{ id: 'torn-paper', name: 'Torn Paper', description: 'Irregular jagged edges', icon: '📄' },
		{ id: 'gradient-blend', name: 'Gradient Blend', description: 'Multi-pass feather', icon: '🎨' }
	];

	function selectEffect(effectId: EffectMode) {
		projectState.updateEffect({ mode: effectId });
		historyStore.snapshot(`Effect: ${effectId}`);
	}

	function updateIntensity(value: number) {
		projectState.updateEffect({ intensity: value });
	}

	// Effect-specific params based on current effect
	$effect(() => {
		const mode = $projectState.effect.mode;
		// Set default params based on effect type
		if (mode === 'wavy' && !$projectState.effect.params.frequency) {
			projectState.updateEffect({
				params: { frequency: 5, amplitude: 10, seed: Math.random() * 1000 }
			});
		} else if (mode === 'torn-paper' && !$projectState.effect.params.roughness) {
			projectState.updateEffect({
				params: { roughness: 5, seed: Math.random() * 1000 }
			});
		}
	});
</script>

<Panel title="Edge Effects" panelId="effects">
	<!-- Effect Selection -->
	<div class="effects-grid">
		{#each effects as effect}
			<button
				class="effect-btn"
				class:selected={$projectState.effect.mode === effect.id}
				onclick={() => selectEffect(effect.id)}
				title={effect.description}
			>
				<span class="effect-icon">{effect.icon}</span>
				<span class="effect-name">{effect.name}</span>
			</button>
		{/each}
	</div>

	<!-- Intensity Slider (shown when effect is active) -->
	{#if $projectState.effect.mode !== 'none'}
		<div class="effect-controls">
			<div class="control-row">
				<label class="control-label">
					<span>Intensity</span>
					<span class="control-value">{$projectState.effect.intensity}%</span>
				</label>
				<input
					type="range"
					min="0"
					max="100"
					value={$projectState.effect.intensity}
					oninput={(e) => updateIntensity(parseInt(e.currentTarget.value))}
					class="slider"
				/>
			</div>

			<!-- Effect-specific controls -->
			{#if $projectState.effect.mode === 'wavy'}
				<div class="control-row">
					<label class="control-label">
						<span>Frequency</span>
						<span class="control-value">{$projectState.effect.params.frequency || 5}</span>
					</label>
					<input
						type="range"
						min="1"
						max="20"
						value={$projectState.effect.params.frequency || 5}
						oninput={(e) =>
							projectState.updateEffect({
								params: {
									...$projectState.effect.params,
									frequency: parseInt(e.currentTarget.value)
								}
							})}
						class="slider"
					/>
				</div>
				<div class="control-row">
					<label class="control-label">
						<span>Amplitude</span>
						<span class="control-value">{$projectState.effect.params.amplitude || 10}px</span>
					</label>
					<input
						type="range"
						min="1"
						max="50"
						value={$projectState.effect.params.amplitude || 10}
						oninput={(e) =>
							projectState.updateEffect({
								params: {
									...$projectState.effect.params,
									amplitude: parseInt(e.currentTarget.value)
								}
							})}
						class="slider"
					/>
				</div>
			{:else if $projectState.effect.mode === 'torn-paper'}
				<div class="control-row">
					<label class="control-label">
						<span>Roughness</span>
						<span class="control-value">{$projectState.effect.params.roughness || 5}</span>
					</label>
					<input
						type="range"
						min="1"
						max="20"
						value={$projectState.effect.params.roughness || 5}
						oninput={(e) =>
							projectState.updateEffect({
								params: {
									...$projectState.effect.params,
									roughness: parseInt(e.currentTarget.value)
								}
							})}
						class="slider"
					/>
				</div>
			{/if}

			<!-- Randomize button for noise-based effects -->
			{#if $projectState.effect.mode === 'wavy' || $projectState.effect.mode === 'torn-paper'}
				<button
					class="randomize-btn"
					onclick={() =>
						projectState.updateEffect({
							params: {
								...$projectState.effect.params,
								seed: Math.random() * 1000
							}
						})}
				>
					🎲 Randomize
				</button>
			{/if}
		</div>
	{/if}
</Panel>

<style>
	.effects-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-md);
	}

	.effect-btn {
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

	.effect-btn:hover {
		background: var(--color-bg-hover);
	}

	.effect-btn.selected {
		border-color: var(--color-accent);
		background: var(--color-bg-active);
	}

	.effect-icon {
		font-size: 20px;
	}

	.effect-name {
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
	}

	.effect-controls {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		padding-top: var(--spacing-md);
		border-top: 1px solid var(--color-border);
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

	.randomize-btn {
		padding: var(--spacing-sm);
		background: var(--color-bg-tertiary);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-size: var(--font-size-sm);
	}

	.randomize-btn:hover {
		background: var(--color-bg-active);
	}
</style>
