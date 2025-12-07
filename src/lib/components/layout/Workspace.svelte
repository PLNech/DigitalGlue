<script lang="ts">
	import { projectState } from '$state/project';
	import { uiState } from '$state/ui';
	import SourcePanel from '$components/panels/SourcePanel.svelte';
	import MaskPanel from '$components/panels/MaskPanel.svelte';
	import EffectsPanel from '$components/panels/EffectsPanel.svelte';
	import AdjustmentsPanel from '$components/panels/AdjustmentsPanel.svelte';
	import PreviewCanvas from '$components/canvas/PreviewCanvas.svelte';

	// Debug logging
	$effect(() => {
		console.log('[Workspace] State update:', {
			hasSource1: !!$projectState.sources.source1,
			hasSource2: !!$projectState.sources.source2,
			maskType: $projectState.mask.type,
			maskPatternId: $projectState.mask.patternId,
			effectMode: $projectState.effect.mode
		});
	});
</script>

<main class="workspace">
	<!-- Left Panel Area -->
	<div class="panels-left">
		<SourcePanel />
		<MaskPanel />
	</div>

	<!-- Canvas Area -->
	<div class="canvas-area">
		<div class="canvas-container">
			{#if !$projectState.sources.source1}
				<div class="empty-state">
					<div class="empty-icon">📷</div>
					<h2>Welcome to DigitalGlue</h2>
					<p>Load source images to begin creating your collage</p>
				</div>
			{:else}
				<PreviewCanvas />
			{/if}
		</div>
	</div>

	<!-- Right Panel Area -->
	<div class="panels-right">
		<EffectsPanel />
		<AdjustmentsPanel />
	</div>
</main>

<style>
	.workspace {
		display: flex;
		flex: 1;
		overflow: hidden;
		background: var(--color-bg-primary);
	}

	.panels-left,
	.panels-right {
		width: var(--panel-width);
		background: var(--color-bg-secondary);
		border-color: var(--color-border);
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}

	.panels-left {
		border-right: 1px solid var(--color-border);
	}

	.panels-right {
		border-left: 1px solid var(--color-border);
	}

	.canvas-area {
		flex: 1;
		display: flex;
		overflow: hidden;
		background:
			linear-gradient(45deg, #1e1e2e 25%, transparent 25%),
			linear-gradient(-45deg, #1e1e2e 25%, transparent 25%),
			linear-gradient(45deg, transparent 75%, #1e1e2e 75%),
			linear-gradient(-45deg, transparent 75%, #1e1e2e 75%);
		background-size: 20px 20px;
		background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
		background-color: #161622;
	}

	.canvas-container {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-md);
		text-align: center;
		color: var(--color-text-secondary);
	}

	.empty-icon {
		font-size: 48px;
		margin-bottom: var(--spacing-sm);
	}

	.empty-state h2 {
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.empty-state p {
		font-size: var(--font-size-sm);
		max-width: 300px;
	}

	.primary-button {
		padding: var(--spacing-sm) var(--spacing-lg);
		background: var(--color-accent);
		color: white;
		border-radius: var(--radius-md);
		font-weight: 500;
		transition: background var(--transition-fast);
	}

	.primary-button:hover {
		background: var(--color-accent-hover);
	}

	.canvas-placeholder {
		padding: var(--spacing-xl);
		background: var(--color-bg-panel);
		border-radius: var(--radius-lg);
		color: var(--color-text-muted);
	}
</style>
