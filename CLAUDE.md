# DigitalGlue - Photo Collage Web App

A web-based photo collage editor for creating layered compositions with masks and artistic edge effects. Offline-capable PWA.

## Tech Stack
- **SvelteKit** + TypeScript
- **Konva.js** for canvas rendering
- **Web Workers** for heavy image processing (CRITICAL - never block main thread)
- **Vitest** (unit) + **Playwright** (E2E)

## Architecture
```
src/lib/
├── components/     # Svelte UI components
│   ├── layout/     # MenuBar, Toolbar, Workspace
│   ├── panels/     # Source, Mask, Effects, Adjustments
│   └── canvas/     # PreviewCanvas (Konva stage)
├── state/          # Svelte stores (project, UI, history)
├── core/           # Business logic
│   ├── patterns.ts # Mask pattern generation
│   └── workers/    # Web Workers for processing
└── io/             # File I/O (.glue format, PNG export)
```

## Core Features
- **Sources**: 1-2 images (or single in clone mode)
- **Masks**: Patterns, uploaded images, or freehand drawn
- **Edge Effects**: 5 modes (soft-feather, shadow-feather, wavy, torn-paper, gradient-blend)
- **Adjustments**: Per-source rotation, brightness, contrast, saturation
- **History**: Undo/redo with Memento pattern
- **Projects**: Save/load `.glue` files
- **Export**: High-quality PNG

## TDD Approach - MANDATORY

**RED → GREEN → REFACTOR**

1. **Write test first** (describes expected behavior)
2. **Implement** minimal code to pass
3. **Refactor** while keeping tests green

### Testing
- **Unit** (`vitest`): State, core logic, workers
- **E2E** (`playwright`): User workflows, interactions
- **Coverage**: 100% for new features

### Performance Tests
Before commit, verify NO main thread blocking:
- Load large image (4000x3000px) - no freeze?
- Adjust sliders - smooth?
- Pan/zoom - responsive?

## Development Workflow

```bash
# Run tests in watch mode (TDD)
npm test -- path/to/file.test.ts --watch

# Run all tests
npm test -- --run

# E2E tests
npm run test:e2e

# Dev server
npm run dev

# Build
npm run build
```

## Git Commits
Format: `[TDD] Feature name`
- Include: ✅ Tests, ✨ Implementation, 📊 Coverage
- Commit only when ALL tests pass

## Known Issues (fix with TDD)
1. Masks not applying - no test
2. Adjustments not working - no test validates
3. Source2 not rendering - no E2E test
4. Threshold preview missing - no test

## Code Standards
- TypeScript strict mode
- Proper error handling for async ops
- Debug logs: `[ComponentName]` prefix
- Web Workers for heavy compute
- commit early and often, have good git practices