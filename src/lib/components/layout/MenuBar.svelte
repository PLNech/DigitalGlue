<script lang="ts">
	import { uiState } from '$state/ui';

	type MenuItem = {
		label: string;
		items: { label: string; shortcut?: string; action?: () => void; separator?: boolean }[];
	};

	const menus: MenuItem[] = [
		{
			label: 'File',
			items: [
				{ label: 'New Project', shortcut: 'Ctrl+N', action: () => console.log('New') },
				{ label: 'Open...', shortcut: 'Ctrl+O', action: () => console.log('Open') },
				{ separator: true, label: '' },
				{ label: 'Save', shortcut: 'Ctrl+S', action: () => console.log('Save') },
				{ label: 'Save As...', shortcut: 'Ctrl+Shift+S', action: () => console.log('SaveAs') },
				{ separator: true, label: '' },
				{ label: 'Export PNG...', shortcut: 'Ctrl+E', action: () => console.log('Export') }
			]
		},
		{
			label: 'Edit',
			items: [
				{ label: 'Undo', shortcut: 'Ctrl+Z', action: () => console.log('Undo') },
				{ label: 'Redo', shortcut: 'Ctrl+Y', action: () => console.log('Redo') },
				{ separator: true, label: '' },
				{ label: 'Reset View', shortcut: 'Ctrl+0', action: () => console.log('ResetView') }
			]
		},
		{
			label: 'View',
			items: [
				{ label: 'Zoom In', shortcut: 'Ctrl++', action: () => console.log('ZoomIn') },
				{ label: 'Zoom Out', shortcut: 'Ctrl+-', action: () => console.log('ZoomOut') },
				{ label: 'Fit to Window', shortcut: 'Ctrl+1', action: () => console.log('Fit') }
			]
		},
		{
			label: 'Help',
			items: [
				{ label: 'About DigitalGlue', action: () => console.log('About') },
				{ label: 'Keyboard Shortcuts', shortcut: '?', action: () => console.log('Shortcuts') }
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
