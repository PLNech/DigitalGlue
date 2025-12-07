import { describe, it, expect, vi, beforeAll } from 'vitest';
import { patterns, generatePatternMask, getPattern } from './patterns';

// Mock canvas for unit tests - visual validation happens in E2E tests
beforeAll(() => {
	// Mock canvas creation and context
	const mockContext = {
		fillStyle: '',
		strokeStyle: '',
		lineWidth: 0,
		fillRect: vi.fn(),
		strokeRect: vi.fn(),
		beginPath: vi.fn(),
		moveTo: vi.fn(),
		lineTo: vi.fn(),
		arc: vi.fn(),
		fill: vi.fn(),
		stroke: vi.fn(),
		save: vi.fn(),
		restore: vi.fn(),
		translate: vi.fn(),
		rotate: vi.fn(),
		clearRect: vi.fn(),
		closePath: vi.fn()
	};

	HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext as any);
});

describe('Pattern Generation', () => {
	describe('Pattern Registry', () => {
		it('should have all 8 patterns defined', () => {
			const patternIds = Object.keys(patterns);
			expect(patternIds).toHaveLength(8);
			expect(patternIds).toContain('half-vertical');
			expect(patternIds).toContain('half-horizontal');
			expect(patternIds).toContain('diagonal');
			expect(patternIds).toContain('circle');
			expect(patternIds).toContain('diamond');
			expect(patternIds).toContain('stripes-v');
			expect(patternIds).toContain('stripes-h');
			expect(patternIds).toContain('checkerboard');
		});

		it('should return pattern config by ID', () => {
			const pattern = getPattern('half-vertical');
			expect(pattern).toBeDefined();
			expect(pattern?.id).toBe('half-vertical');
			expect(pattern?.name).toBe('Half Vertical');
			expect(pattern?.generate).toBeTypeOf('function');
		});

		it('should return undefined for unknown pattern', () => {
			const pattern = getPattern('unknown' as any);
			expect(pattern).toBeUndefined();
		});
	});

	describe('Pattern Generation', () => {
		it('should generate canvas with correct dimensions', () => {
			const patterns = ['half-vertical', 'half-horizontal', 'diagonal', 'circle',
											 'diamond', 'stripes-v', 'stripes-h', 'checkerboard'] as const;

			patterns.forEach(patternId => {
				const mask = generatePatternMask(patternId, 100, 200);
				expect(mask, `${patternId} should return canvas`).not.toBeNull();
				expect(mask?.width, `${patternId} width`).toBe(100);
				expect(mask?.height, `${patternId} height`).toBe(200);
			});
		});

		it('should create canvas context and call drawing methods', () => {
			const mask = generatePatternMask('half-vertical', 100, 100);
			const ctx = mask?.getContext('2d');

			expect(ctx).toBeDefined();
			// Canvas drawing methods should be called (via mock)
			expect(ctx?.fillRect).toHaveBeenCalled();
		});
	});

	describe('Error Handling', () => {
		it('should return null for invalid pattern ID', () => {
			const mask = generatePatternMask('invalid' as any, 100, 100);
			expect(mask).toBeNull();
		});

		it('should handle zero dimensions', () => {
			const mask = generatePatternMask('half-vertical', 0, 0);
			expect(mask).not.toBeNull();
			expect(mask?.width).toBe(0);
			expect(mask?.height).toBe(0);
		});

		it('should handle large dimensions', () => {
			const mask = generatePatternMask('circle', 4000, 3000);
			expect(mask).not.toBeNull();
			expect(mask?.width).toBe(4000);
			expect(mask?.height).toBe(3000);
		});
	});
});

// Note: Visual validation of pattern correctness is done in E2E tests
// where we have real browser canvas APIs available
