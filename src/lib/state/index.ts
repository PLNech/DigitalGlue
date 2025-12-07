// Re-export all state stores for convenient imports
export { projectState, hasSource1, hasSource2, hasMask, isSingleSourceMode } from './project';
export type {
	SourceConfig,
	MaskConfig,
	EffectMode,
	EffectConfig,
	ProjectStateData,
	GlueProject,
	HistorySnapshot
} from './project';

export { uiState, isZoomedIn, isZoomedOut, zoomPercent } from './ui';
export type { Tool, PanelId, UIStateData } from './ui';

export { historyStore, canUndo, canRedo, historyLength, currentHistoryIndex } from './history';
