# DigitalGlue 🎨

A web-based photo collage editor for creating layered compositions with masks and artistic edge effects.

![DigitalGlue Preview](./static/meta/preview.jpg)

*Create stunning photo collages with mask-based compositing and edge effects*

## ✨ Features

- ✅ **Mask-Based Compositing**: Combine 2 source images using masks
- ✅ **Multiple Mask Types**: Patterns (8 geometric), uploaded images, or freehand drawing
- ✅ **Mask Controls**: Scale (10-500%), rotation (0-360°), threshold, invert
- ✅ **Source Adjustments**: Scale, position, rotation, brightness, contrast, saturation, invert
- ✅ **Pattern Modes**: Infinite tiling (stripes/checkerboard) vs finite shapes (circle/diamond)
- ✅ **Export Dialog**: PNG/JPEG with preview, scale selector, quality control, size estimation
- ✅ **Freehand Editor**: Draw masks with brush/eraser tools
- ✅ **Edge Effects**: 5 artistic treatments (soft-feather, shadow-feather, wavy, torn-paper, gradient-blend)
- 🚧 **Project Management**: Save/load `.glue` projects
- 🚧 **PWA**: Offline capability

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
