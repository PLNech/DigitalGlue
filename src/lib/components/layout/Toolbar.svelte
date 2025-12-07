<script lang="ts">
	import { uiState } from '$state/ui';
</script>

<aside class="toolbar">
	<!-- Simplified toolbar - drag/scroll on canvas for pan/zoom -->
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
