import { writable } from 'svelte/store';

/**
 * Export trigger - allows MenuBar to request export from PreviewCanvas
 */

export interface ExportRequest {
	timestamp: number;
	scale?: number;
}

function createExportTrigger() {
	const { subscribe, set } = writable<ExportRequest | null>(null);

	return {
		subscribe,

		// Request an export (triggers PreviewCanvas to export)
		requestExport(scale = 1.0) {
			set({ timestamp: Date.now(), scale });
		},

		// Clear the request after handling
		clear() {
			set(null);
		}
	};
}

export const exportTrigger = createExportTrigger();

// Helper function for MenuBar to trigger export
export function exportComposite(scale = 1.0) {
	exportTrigger.requestExport(scale);
}
