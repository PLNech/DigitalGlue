import { uiState } from './ui';

/**
 * Export trigger - shows export dialog
 */

// Helper function for MenuBar to trigger export
export function exportComposite() {
	uiState.showExport();
}
