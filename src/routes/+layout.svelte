<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>DigitalGlue - Photo Collage Editor</title>
</svelte:head>

{@render children()}
