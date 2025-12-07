# DigitalGlue 🎨

A web-based photo collage editor for creating layered compositions with masks and artistic edge effects.

## Features

- **Dual Source Compositing**: Combine 2 source images (or clone a single source)
- **Flexible Masking**: Upload custom masks, use built-in patterns, or draw your own
- **Edge Effects**: 5 artistic edge treatments (soft feather, shadow feather, wavy, torn paper, gradient blend)
- **Per-Source Adjustments**: Rotation, brightness, contrast, saturation
- **Project Management**: Save/load `.glue` projects with full undo/redo history
- **High-Quality Export**: Export to PNG with customizable resolution
- **Offline-Capable PWA**: Works without internet once loaded

## Tech Stack

- **SvelteKit** + TypeScript
- **Konva.js** for canvas rendering
- **Native Canvas API** + Web Workers for image processing
- **Perlin/Simplex noise** for organic edge distortion

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Live Demo

Visit: [https://plnech.github.io/DigitalGlue/](https://plnech.github.io/DigitalGlue/)

## License

MIT © 2025 Paul-Louis Nech
