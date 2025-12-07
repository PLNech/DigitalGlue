import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { historyStore, canUndo, canRedo } from './history';
import { projectState } from './project';

describe('historyStore', () => {
	beforeEach(() => {
		projectState.reset();
		historyStore.clear();
	});

	describe('initialization', () => {
		it('should start with empty history', () => {
			const snapshots = historyStore.getSnapshots();
			expect(snapshots).toHaveLength(0);
		});

		it('should initialize with current state', () => {
			historyStore.initialize();
			const snapshots = historyStore.getSnapshots();
			expect(snapshots).toHaveLength(1);
			expect(snapshots[0].label).toBe('Initial State');
		});
	});

	describe('snapshot', () => {
		it('should add snapshot to history', () => {
			historyStore.initialize();
			projectState.updateMask({ threshold: 200 });
			historyStore.snapshot('Update threshold');

			const snapshots = historyStore.getSnapshots();
			expect(snapshots).toHaveLength(2);
			expect(snapshots[1].label).toBe('Update threshold');
		});

		it('should capture current state in snapshot', () => {
			historyStore.initialize();
			projectState.updateMask({ threshold: 200 });
			historyStore.snapshot('Update threshold');

			const snapshots = historyStore.getSnapshots();
			expect(snapshots[1].state.mask.threshold).toBe(200);
		});
	});

	describe('undo/redo', () => {
		beforeEach(() => {
			historyStore.initialize();
			projectState.updateMask({ threshold: 100 });
			historyStore.snapshot('Change 1');
			projectState.updateMask({ threshold: 200 });
			historyStore.snapshot('Change 2');
		});

		it('should undo to previous state', () => {
			const result = historyStore.undo();
			expect(result).toBe(true);

			const state = get(projectState);
			expect(state.mask.threshold).toBe(100);
		});

		it('should redo to next state', () => {
			historyStore.undo();
			const result = historyStore.redo();
			expect(result).toBe(true);

			const state = get(projectState);
			expect(state.mask.threshold).toBe(200);
		});

		it('should not undo past initial state', () => {
			historyStore.undo();
			historyStore.undo();
			const result = historyStore.undo(); // Should fail - at start
			expect(result).toBe(false);
		});

		it('should not redo past latest state', () => {
			const result = historyStore.redo(); // Should fail - at end
			expect(result).toBe(false);
		});

		it('should clear redo history when making new change', () => {
			historyStore.undo();
			projectState.updateMask({ threshold: 150 });
			historyStore.snapshot('New change');

			const result = historyStore.redo();
			expect(result).toBe(false); // Old redo history cleared
		});
	});

	describe('derived stores', () => {
		it('canUndo should reflect history state', () => {
			expect(get(canUndo)).toBe(false);

			historyStore.initialize();
			expect(get(canUndo)).toBe(false);

			historyStore.snapshot('Change');
			expect(get(canUndo)).toBe(true);
		});

		it('canRedo should reflect history state', () => {
			historyStore.initialize();
			historyStore.snapshot('Change');

			expect(get(canRedo)).toBe(false);

			historyStore.undo();
			expect(get(canRedo)).toBe(true);
		});
	});

	describe('jumpTo', () => {
		beforeEach(() => {
			historyStore.initialize();
			projectState.updateMask({ threshold: 100 });
			historyStore.snapshot('Change 1');
			projectState.updateMask({ threshold: 200 });
			historyStore.snapshot('Change 2');
			projectState.updateMask({ threshold: 300 });
			historyStore.snapshot('Change 3');
		});

		it('should jump to specific snapshot', () => {
			const result = historyStore.jumpTo(1);
			expect(result).toBe(true);

			const state = get(projectState);
			expect(state.mask.threshold).toBe(100);
		});

		it('should not jump to invalid index', () => {
			const result = historyStore.jumpTo(10);
			expect(result).toBe(false);
		});
	});
});
