<script lang="ts">
	import { uiState } from '$state/ui';

	type MenuItem = {
		label: string;
		items: { label: string; shortcut?: string; action?: () => void; separator?: boolean }[];
	};

	import { historyStore } from '$state/history';
	import { projectState } from '$state/project';
	import { exportComposite } from '$state/export-trigger';

	function handleNew() {
		if (confirm('Start a new project? Current work will be lost.')) {
			projectState.reset();
			historyStore.clear();
			historyStore.initialize();
			uiState.resetZoom();
		}
	}

	function handleUndo() {
		historyStore.undo();
	}

	function handleRedo() {
		historyStore.redo();
	}

	function handleResetView() {
		uiState.resetZoom();
	}

	function handleZoomIn() {
		uiState.zoomIn();
	}

	function handleZoomOut() {
		uiState.zoomOut();
	}

	function handleFitToWindow() {
		uiState.setZoom(1);
		uiState.setPan(0, 0);
	}

	const menus: MenuItem[] = [
		{
			label: 'File',
			items: [
				{ label: 'New Project', shortcut: 'Ctrl+N', action: handleNew },
				{ label: 'Open...', shortcut: 'Ctrl+O', action: () => alert('Open: Coming soon!') },
				{ separator: true, label: '' },
				{ label: 'Save', shortcut: 'Ctrl+S', action: () => alert('Save: Coming soon!') },
				{ label: 'Save As...', shortcut: 'Ctrl+Shift+S', action: () => alert('Save As: Coming soon!') },
				{ separator: true, label: '' },
				{ label: 'Export PNG...', shortcut: 'Ctrl+E', action: () => exportComposite() }
			]
		},
		{
			label: 'Edit',
			items: [
				{ label: 'Undo', shortcut: 'Ctrl+Z', action: handleUndo },
				{ label: 'Redo', shortcut: 'Ctrl+Y', action: handleRedo },
				{ separator: true, label: '' },
				{ label: 'Reset View', shortcut: 'Ctrl+0', action: handleResetView }
			]
		},
		{
			label: 'View',
			items: [
				{ label: 'Zoom In', shortcut: 'Ctrl++', action: handleZoomIn },
				{ label: 'Zoom Out', shortcut: 'Ctrl+-', action: handleZoomOut },
				{ label: 'Fit to Window', shortcut: 'Ctrl+1', action: handleFitToWindow }
			]
		},
		{
			label: 'Help',
			items: [
				{ label: 'About DigitalGlue', action: () => alert('DigitalGlue v0.1.0\nPhoto Collage Editor\nMIT License © 2025') },
				{ label: 'Keyboard Shortcuts', shortcut: '?', action: () => alert('Keyboard Shortcuts:\n\n• Drag canvas: Pan\n• Scroll: Zoom\n• Ctrl+Z: Undo\n• Ctrl+Y: Redo\n• Ctrl+0: Reset View') }
			]
		}
	];

	let activeMenu = $state<string | null>(null);

	function toggleMenu(label: string) {
		activeMenu = activeMenu === label ? null : label;
	}

	function closeMenu() {
		activeMenu = null;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeMenu();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<header class="menubar">
	<div class="menu-left">
		<span class="app-title">DigitalGlue</span>
		{#each menus as menu}
			<div class="menu-wrapper">
				<button
					class="menu-trigger"
					class:active={activeMenu === menu.label}
					onclick={() => toggleMenu(menu.label)}
					onmouseenter={() => activeMenu && (activeMenu = menu.label)}
				>
					{menu.label}
				</button>
				{#if activeMenu === menu.label}
					<div class="menu-dropdown" role="menu">
						{#each menu.items as item}
							{#if item.separator}
								<div class="menu-separator"></div>
							{:else}
								<button
									class="menu-item"
									role="menuitem"
									onclick={() => { item.action?.(); closeMenu(); }}
								>
									<span class="menu-item-label">{item.label}</span>
									{#if item.shortcut}
										<span class="menu-item-shortcut">{item.shortcut}</span>
									{/if}
								</button>
							{/if}
						{/each}
					</div>
				{/if}
			</div>
		{/each}
	</div>
</header>

<!-- Backdrop to close menu when clicking outside -->
{#if activeMenu}
	<div class="menu-backdrop" onclick={closeMenu} onkeydown={() => {}} role="presentation"></div>
{/if}

<style>
	.menubar {
		display: flex;
		align-items: center;
		height: var(--menubar-height);
		background: var(--color-bg-secondary);
		border-bottom: 1px solid var(--color-border);
		padding: 0 var(--spacing-sm);
		user-select: none;
		z-index: 100;
	}

	.menu-left {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
	}

	.app-title {
		font-weight: 600;
		font-size: var(--font-size-sm);
		color: var(--color-accent);
		padding: 0 var(--spacing-md);
		margin-right: var(--spacing-sm);
	}

	.menu-wrapper {
		position: relative;
	}

	.menu-trigger {
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-sm);
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		transition: background var(--transition-fast), color var(--transition-fast);
	}

	.menu-trigger:hover,
	.menu-trigger.active {
		background: var(--color-bg-hover);
		color: var(--color-text-primary);
	}

	.menu-dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		min-width: 200px;
		background: var(--color-bg-panel);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--spacing-xs) 0;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		z-index: 101;
	}

	.menu-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: var(--spacing-sm) var(--spacing-md);
		font-size: var(--font-size-sm);
		text-align: left;
		transition: background var(--transition-fast);
	}

	.menu-item:hover {
		background: var(--color-bg-hover);
	}

	.menu-item-label {
		flex: 1;
	}

	.menu-item-shortcut {
		color: var(--color-text-muted);
		font-size: var(--font-size-xs);
		margin-left: var(--spacing-lg);
	}

	.menu-separator {
		height: 1px;
		background: var(--color-border);
		margin: var(--spacing-xs) 0;
	}

	.menu-backdrop {
		position: fixed;
		inset: 0;
		z-index: 99;
	}
</style>
