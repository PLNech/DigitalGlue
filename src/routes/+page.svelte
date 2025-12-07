<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import MenuBar from '$components/layout/MenuBar.svelte';
	import Toolbar from '$components/layout/Toolbar.svelte';
	import Workspace from '$components/layout/Workspace.svelte';
	import { projectState } from '$state/project';
	import { loadDefaultImages, getImageDimensions } from '$lib/utils/default-images';

	// Load default images on mount for easier debugging
	onMount(async () => {
		if (!browser) return;

		console.log('[App] Loading default images for debugging...');

		const { image1, image2 } = await loadDefaultImages();

		if (image1) {
			const dims1 = await getImageDimensions(image1);
			projectState.setSource1({
				imageData: image1,
				fileName: '140-pana_med_hr.jpeg',
				width: dims1.width,
				height: dims1.height,
				rotation: 0,
				brightness: 0,
				contrast: 0,
				saturation: 0,
				invertColors: false
			});
			console.log('[App] Loaded default source 1');
		}

		if (image2) {
			const dims2 = await getImageDimensions(image2);
			projectState.setSource2({
				imageData: image2,
				fileName: '144-tuni_med_hr.jpeg',
				width: dims2.width,
				height: dims2.height,
				rotation: 0,
				brightness: 0,
				contrast: 0,
				saturation: 0,
				invertColors: false
			});
			console.log('[App] Loaded default source 2');
		}

		// Set default mask pattern to horizontal stripes
		projectState.setMask({
			type: 'pattern',
			patternId: 'stripes-h',
			threshold: 128,
			invert: false,
			scale: 100,
			rotation: 0
		});
		console.log('[App] Set default mask to horizontal stripes');
	});
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
