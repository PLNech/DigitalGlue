import { writable, derived } from 'svelte/store';

export type Tool = 'select' | 'pan' | 'zoom';
export type PanelId = 'source' | 'mask' | 'effects' | 'adjustments';

export interface UIStateData {
	currentTool: Tool;
	zoom: number;
	panX: number;
	panY: number;
	expandedPanels: Set<PanelId>;
	showGrid: boolean;
	isProcessing: boolean;
	statusMessage: string | null;
}

const defaultUIState: UIStateData = {
	currentTool: 'select',
	zoom: 1,
	panX: 0,
	panY: 0,
	expandedPanels: new Set(['source', 'mask', 'effects', 'adjustments']),
	showGrid: true,
	isProcessing: false,
	statusMessage: null
};

function createUIStore() {
	const { subscribe, set, update } = writable<UIStateData>(defaultUIState);

	return {
		subscribe,

		// Tool management
		setTool(tool: Tool) {
			update((state) => ({ ...state, currentTool: tool }));
		},

		// Zoom management
		setZoom(zoom: number) {
			update((state) => ({
				...state,
				zoom: Math.max(0.1, Math.min(10, zoom))
			}));
		},

		zoomIn() {
			update((state) => ({
				...state,
				zoom: Math.min(10, state.zoom * 1.2)
			}));
		},

		zoomOut() {
			update((state) => ({
				...state,
				zoom: Math.max(0.1, state.zoom / 1.2)
			}));
		},

		resetZoom() {
			update((state) => ({ ...state, zoom: 1, panX: 0, panY: 0 }));
		},

		// Pan management
		setPan(x: number, y: number) {
			update((state) => ({ ...state, panX: x, panY: y }));
		},

		// Panel management
		togglePanel(panelId: PanelId) {
			update((state) => {
				const newExpanded = new Set(state.expandedPanels);
				if (newExpanded.has(panelId)) {
					newExpanded.delete(panelId);
				} else {
					newExpanded.add(panelId);
				}
				return { ...state, expandedPanels: newExpanded };
			});
		},

		isPanelExpanded(panelId: PanelId): boolean {
			let expanded = false;
			subscribe((state) => {
				expanded = state.expandedPanels.has(panelId);
			})();
			return expanded;
		},

		// Grid
		toggleGrid() {
			update((state) => ({ ...state, showGrid: !state.showGrid }));
		},

		// Processing state
		setProcessing(isProcessing: boolean, message?: string) {
			update((state) => ({
				...state,
				isProcessing,
				statusMessage: message ?? null
			}));
		},

		// Status message
		setStatus(message: string | null) {
			update((state) => ({ ...state, statusMessage: message }));
		},

		// Reset
		reset() {
			set(defaultUIState);
		}
	};
}

export const uiState = createUIStore();

// Derived stores
export const isZoomedIn = derived(uiState, ($state) => $state.zoom > 1);
export const isZoomedOut = derived(uiState, ($state) => $state.zoom < 1);
export const zoomPercent = derived(uiState, ($state) => Math.round($state.zoom * 100));
