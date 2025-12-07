<script lang="ts">
	import { uiState, type PanelId } from '$state/ui';

	interface Props {
		title: string;
		panelId: PanelId;
		children?: import('svelte').Snippet;
	}

	let { title, panelId, children }: Props = $props();

	let isExpanded = $derived($uiState.expandedPanels.has(panelId));

	function toggle() {
		uiState.togglePanel(panelId);
	}
</script>

<section class="panel" class:collapsed={!isExpanded}>
	<button class="panel-header" onclick={toggle}>
		<span class="panel-title">{title}</span>
		<span class="panel-toggle">{isExpanded ? '−' : '+'}</span>
	</button>

	{#if isExpanded}
		<div class="panel-content">
			{@render children?.()}
		</div>
	{/if}
</section>

<style>
	.panel {
		border-bottom: 1px solid var(--color-border);
	}

	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: var(--spacing-sm) var(--spacing-md);
		background: var(--color-bg-panel);
		text-align: left;
		transition: background var(--transition-fast);
	}

	.panel-header:hover {
		background: var(--color-bg-hover);
	}

	.panel-title {
		font-size: var(--font-size-sm);
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.panel-toggle {
		font-size: var(--font-size-lg);
		color: var(--color-text-muted);
		line-height: 1;
	}

	.panel-content {
		padding: var(--spacing-md);
		background: var(--color-bg-secondary);
	}

	.panel.collapsed .panel-header {
		border-bottom: none;
	}
</style>
