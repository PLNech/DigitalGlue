<script lang="ts">
	import { uiState, type Tool } from '$state/ui';

	type ToolConfig = {
		id: Tool;
		label: string;
		icon: string;
	};

	const tools: ToolConfig[] = [
		{ id: 'select', label: 'Select', icon: '⊹' },
		{ id: 'pan', label: 'Pan', icon: '✋' },
		{ id: 'zoom', label: 'Zoom', icon: '🔍' }
	];

	function selectTool(tool: Tool) {
		uiState.setTool(tool);
	}
</script>

<aside class="toolbar">
	<div class="tool-group">
		{#each tools as tool}
			<button
				class="tool-button"
				class:active={$uiState.currentTool === tool.id}
				onclick={() => selectTool(tool.id)}
				title={tool.label}
			>
				<span class="tool-icon">{tool.icon}</span>
			</button>
		{/each}
	</div>

	<div class="toolbar-spacer"></div>

	<div class="tool-group">
		<div class="zoom-display" title="Zoom Level">
			{Math.round($uiState.zoom * 100)}%
		</div>
	</div>
</aside>

<style>
	.toolbar {
		display: flex;
		flex-direction: column;
		width: var(--toolbar-width);
		background: var(--color-bg-secondary);
		border-right: 1px solid var(--color-border);
		padding: var(--spacing-sm);
		gap: var(--spacing-sm);
	}

	.tool-group {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.tool-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: var(--radius-sm);
		transition: background var(--transition-fast);
	}

	.tool-button:hover {
		background: var(--color-bg-hover);
	}

	.tool-button.active {
		background: var(--color-bg-active);
		color: var(--color-accent);
	}

	.tool-icon {
		font-size: 16px;
	}

	.toolbar-spacer {
		flex: 1;
	}

	.zoom-display {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		text-align: center;
		padding: var(--spacing-xs);
	}
</style>
