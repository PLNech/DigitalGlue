import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { projectState, hasSource1, hasSource2, isSingleSourceMode } from './project';

describe('projectState', () => {
	beforeEach(() => {
		projectState.reset();
	});

	describe('initial state', () => {
		it('should have null sources initially', () => {
			const state = get(projectState);
			expect(state.sources.source1).toBeNull();
			expect(state.sources.source2).toBeNull();
		});

		it('should have default mask config', () => {
			const state = get(projectState);
			expect(state.mask.type).toBe('pattern');
			expect(state.mask.patternId).toBe('half-vertical');
			expect(state.mask.threshold).toBe(128);
			expect(state.mask.invert).toBe(false);
		});

		it('should have default effect config', () => {
			const state = get(projectState);
			expect(state.effect.mode).toBe('none');
			expect(state.effect.intensity).toBe(50);
		});
	});

	describe('source management', () => {
		const mockSource = {
			imageData: 'data:image/png;base64,test',
			fileName: 'test.png',
			width: 1000,
			height: 800,
			rotation: 0,
			brightness: 0,
			scale: 100,
			positionX: 0,
			positionY: 0,
			contrast: 0,
			saturation: 0,
		invertColors: false
		};

		it('should set source1', () => {
			projectState.setSource1(mockSource);
			const state = get(projectState);
			expect(state.sources.source1).toEqual(mockSource);
		});

		it('should set source2', () => {
			projectState.setSource2(mockSource);
			const state = get(projectState);
			expect(state.sources.source2).toEqual(mockSource);
		});

		it('should update source1 properties', () => {
			projectState.setSource1(mockSource);
			projectState.updateSource1({ rotation: 45, brightness: 10 });
			const state = get(projectState);
			expect(state.sources.source1?.rotation).toBe(45);
			expect(state.sources.source1?.brightness).toBe(10);
		});

		it('should clear source1', () => {
			projectState.setSource1(mockSource);
			projectState.setSource1(null);
			const state = get(projectState);
			expect(state.sources.source1).toBeNull();
		});
	});

	describe('mask management', () => {
		it('should update mask type', () => {
			projectState.updateMask({ type: 'upload' });
			const state = get(projectState);
			expect(state.mask.type).toBe('upload');
		});

		it('should update mask threshold', () => {
			projectState.updateMask({ threshold: 200 });
			const state = get(projectState);
			expect(state.mask.threshold).toBe(200);
		});

		it('should toggle invert', () => {
			projectState.updateMask({ invert: true });
			const state = get(projectState);
			expect(state.mask.invert).toBe(true);
		});
	});

	describe('effect management', () => {
		it('should update effect mode', () => {
			projectState.updateEffect({ mode: 'soft-feather' });
			const state = get(projectState);
			expect(state.effect.mode).toBe('soft-feather');
		});

		it('should update effect intensity', () => {
			projectState.updateEffect({ intensity: 75 });
			const state = get(projectState);
			expect(state.effect.intensity).toBe(75);
		});

		it('should update effect params', () => {
			projectState.updateEffect({ params: { frequency: 10 } });
			const state = get(projectState);
			expect(state.effect.params.frequency).toBe(10);
		});
	});

	describe('derived stores', () => {
		const mockSource = {
			imageData: 'data:image/png;base64,test',
			fileName: 'test.png',
			width: 1000,
			height: 800,
			rotation: 0,
			brightness: 0,
			scale: 100,
			positionX: 0,
			positionY: 0,
			contrast: 0,
			saturation: 0,
		invertColors: false
		};

		it('hasSource1 should reflect state', () => {
			expect(get(hasSource1)).toBe(false);
			projectState.setSource1(mockSource);
			expect(get(hasSource1)).toBe(true);
		});

		it('hasSource2 should reflect state', () => {
			expect(get(hasSource2)).toBe(false);
			projectState.setSource2(mockSource);
			expect(get(hasSource2)).toBe(true);
		});

		it('isSingleSourceMode should be true when only source1 is set', () => {
			projectState.setSource1(mockSource);
			expect(get(isSingleSourceMode)).toBe(true);

			projectState.setSource2(mockSource);
			expect(get(isSingleSourceMode)).toBe(false);
		});
	});

	describe('snapshot and load', () => {
		it('should get snapshot of current state', () => {
			projectState.updateMask({ threshold: 150 });
			const snapshot = projectState.getSnapshot();
			expect(snapshot.mask.threshold).toBe(150);
		});

		it('should load state from snapshot', () => {
			const customState = {
				sources: { source1: null, source2: null },
				mask: {
					type: 'upload' as const,
					threshold: 200,
					invert: true,
					scale: 100,
					rotation: 0
				},
				effect: {
					mode: 'wavy' as const,
					intensity: 80,
					params: { frequency: 15 }
				}
			};

			projectState.loadState(customState);
			const state = get(projectState);

			expect(state.mask.type).toBe('upload');
			expect(state.mask.threshold).toBe(200);
			expect(state.effect.mode).toBe('wavy');
			expect(state.effect.intensity).toBe(80);
		});
	});
});
