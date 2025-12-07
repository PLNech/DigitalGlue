import { writable, get } from 'svelte/store';
import { projectState, type ProjectStateData, type HistorySnapshot } from './project';

const MAX_HISTORY_SIZE = 50;

interface HistoryState {
	snapshots: HistorySnapshot[];
	currentIndex: number;
}

function createHistoryStore() {
	const { subscribe, set, update } = writable<HistoryState>({
		snapshots: [],
		currentIndex: -1
	});

	// Deep clone helper
	function cloneState(state: ProjectStateData): ProjectStateData {
		return JSON.parse(JSON.stringify(state));
	}

	return {
		subscribe,

		/**
		 * Take a snapshot of the current project state
		 */
		snapshot(label: string = 'Change') {
			const currentState = projectState.getSnapshot();

			update((history) => {
				// Remove any redo history when making a new change
				const newSnapshots = history.snapshots.slice(0, history.currentIndex + 1);

				// Add new snapshot
				newSnapshots.push({
					timestamp: Date.now(),
					label,
					state: cloneState(currentState)
				});

				// Trim to max size
				while (newSnapshots.length > MAX_HISTORY_SIZE) {
					newSnapshots.shift();
				}

				return {
					snapshots: newSnapshots,
					currentIndex: newSnapshots.length - 1
				};
			});
		},

		/**
		 * Undo to previous state
		 */
		undo(): boolean {
			const history = get({ subscribe });

			if (history.currentIndex <= 0) {
				return false; // Nothing to undo
			}

			const newIndex = history.currentIndex - 1;
			const snapshot = history.snapshots[newIndex];

			if (snapshot) {
				projectState.loadState(cloneState(snapshot.state));
				update((h) => ({ ...h, currentIndex: newIndex }));
				return true;
			}

			return false;
		},

		/**
		 * Redo to next state
		 */
		redo(): boolean {
			const history = get({ subscribe });

			if (history.currentIndex >= history.snapshots.length - 1) {
				return false; // Nothing to redo
			}

			const newIndex = history.currentIndex + 1;
			const snapshot = history.snapshots[newIndex];

			if (snapshot) {
				projectState.loadState(cloneState(snapshot.state));
				update((h) => ({ ...h, currentIndex: newIndex }));
				return true;
			}

			return false;
		},

		/**
		 * Check if undo is available
		 */
		canUndo(): boolean {
			const history = get({ subscribe });
			return history.currentIndex > 0;
		},

		/**
		 * Check if redo is available
		 */
		canRedo(): boolean {
			const history = get({ subscribe });
			return history.currentIndex < history.snapshots.length - 1;
		},

		/**
		 * Get all snapshots for display
		 */
		getSnapshots(): HistorySnapshot[] {
			return get({ subscribe }).snapshots;
		},

		/**
		 * Jump to a specific snapshot
		 */
		jumpTo(index: number): boolean {
			const history = get({ subscribe });

			if (index < 0 || index >= history.snapshots.length) {
				return false;
			}

			const snapshot = history.snapshots[index];
			if (snapshot) {
				projectState.loadState(cloneState(snapshot.state));
				update((h) => ({ ...h, currentIndex: index }));
				return true;
			}

			return false;
		},

		/**
		 * Clear all history
		 */
		clear() {
			set({ snapshots: [], currentIndex: -1 });
		},

		/**
		 * Initialize history with current state
		 */
		initialize() {
			const currentState = projectState.getSnapshot();
			set({
				snapshots: [
					{
						timestamp: Date.now(),
						label: 'Initial State',
						state: cloneState(currentState)
					}
				],
				currentIndex: 0
			});
		}
	};
}

export const historyStore = createHistoryStore();

// Derived stores for UI
import { derived } from 'svelte/store';

export const canUndo = derived(historyStore, ($history) => $history.currentIndex > 0);

export const canRedo = derived(
	historyStore,
	($history) => $history.currentIndex < $history.snapshots.length - 1
);

export const historyLength = derived(historyStore, ($history) => $history.snapshots.length);

export const currentHistoryIndex = derived(historyStore, ($history) => $history.currentIndex);
