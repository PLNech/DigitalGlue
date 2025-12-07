import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: 'index.html',
			precompress: false,
			strict: true
		}),
		paths: {
			base: process.env.NODE_ENV === 'production' ? '/DigitalGlue' : ''
		},
		alias: {
			$lib: './src/lib',
			$components: './src/lib/components',
			$core: './src/lib/core',
			$state: './src/lib/state',
			$io: './src/lib/io'
		}
	}
};

export default config;
