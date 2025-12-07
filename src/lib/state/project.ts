import { writable, derived, get } from 'svelte/store';

// Types for the project state
export interface SourceConfig {
	imageData: string; // Base64 or blob URL
	fileName: string;
	width: number;
	height: number;
	rotation: number; // degrees
	brightness: number; // -100 to 100
	contrast: number; // -100 to 100
	saturation: number; // -100 to 100
}

export interface MaskConfig {
	type: 'upload' | 'pattern' | 'drawn';
	patternId?: string;
	imageData?: string;
	drawnData?: string;
	threshold: number; // 0-255
	invert: boolean;
}

export type EffectMode = 'none' | 'soft-feather' | 'shadow-feather' | 'wavy' | 'torn-paper' | 'gradient-blend';

export interface EffectConfig {
	mode: EffectMode;
	intensity: number; // 0-100
	params: Record<string, number>;
}

export interface HistorySnapshot {
	timestamp: number;
	label: string;
	state: ProjectStateData;
}

export interface ProjectStateData {
	sources: {
		source1: SourceConfig | null;
		source2: SourceConfig | null;
	};
	mask: MaskConfig;
	effect: EffectConfig;
}

export interface GlueProject {
	version: string;
	name: string;
	createdAt: string;
	modifiedAt: string;
	data: ProjectStateData;
	history: HistorySnapshot[];
	currentHistoryIndex: number;
}

// Default state
const defaultMask: MaskConfig = {
	type: 'pattern',
	patternId: 'half-vertical',
	threshold: 128,
	invert: false
};

const defaultEffect: EffectConfig = {
	mode: 'none',
	intensity: 50,
	params: {}
};

const defaultProjectState: ProjectStateData = {
	sources: {
		source1: null,
		source2: null
	},
	mask: defaultMask,
	effect: defaultEffect
};

// Create the store
function createProjectStore() {
	const { subscribe, set, update } = writable<ProjectStateData>(defaultProjectState);

	return {
		subscribe,

		// Source management
		setSource1(source: SourceConfig | null) {
			update((state) => ({
				...state,
				sources: { ...state.sources, source1: source }
			}));
		},

		setSource2(source: SourceConfig | null) {
			update((state) => ({
				...state,
				sources: { ...state.sources, source2: source }
			}));
		},

		updateSource1(updates: Partial<SourceConfig>) {
			update((state) => {
				if (!state.sources.source1) return state;
				return {
					...state,
					sources: {
						...state.sources,
						source1: { ...state.sources.source1, ...updates }
					}
				};
			});
		},

		updateSource2(updates: Partial<SourceConfig>) {
			update((state) => {
				if (!state.sources.source2) return state;
				return {
					...state,
					sources: {
						...state.sources,
						source2: { ...state.sources.source2, ...updates }
					}
				};
			});
		},

		// Mask management
		setMask(mask: MaskConfig) {
			update((state) => ({ ...state, mask }));
		},

		updateMask(updates: Partial<MaskConfig>) {
			update((state) => ({
				...state,
				mask: { ...state.mask, ...updates }
			}));
		},

		// Effect management
		setEffect(effect: EffectConfig) {
			update((state) => ({ ...state, effect }));
		},

		updateEffect(updates: Partial<EffectConfig>) {
			update((state) => ({
				...state,
				effect: { ...state.effect, ...updates }
			}));
		},

		// Full state management
		getSnapshot(): ProjectStateData {
			return get({ subscribe });
		},

		loadState(state: ProjectStateData) {
			set(state);
		},

		reset() {
			set(defaultProjectState);
		}
	};
}

export const projectState = createProjectStore();

// Derived stores for convenience
export const hasSource1 = derived(projectState, ($state) => $state.sources.source1 !== null);
export const hasSource2 = derived(projectState, ($state) => $state.sources.source2 !== null);
export const hasMask = derived(
	projectState,
	($state) => $state.mask.type !== 'pattern' || $state.mask.patternId !== undefined
);
export const isSingleSourceMode = derived(
	projectState,
	($state) => $state.sources.source1 !== null && $state.sources.source2 === null
);
