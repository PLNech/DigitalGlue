<script lang="ts">
	import MenuBar from '$components/layout/MenuBar.svelte';
	import Toolbar from '$components/layout/Toolbar.svelte';
	import Workspace from '$components/layout/Workspace.svelte';
</script>

<div class="app-container">
	<MenuBar />
	<div class="main-content">
		<Toolbar />
		<Workspace />
	</div>
</div>

<style>
	.app-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		overflow: hidden;
	}

	.main-content {
		display: flex;
		flex: 1;
		overflow: hidden;
	}
</style>
