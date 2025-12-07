import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('DigitalGlue Basic Workflow', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
	});

	test('should load the app and show welcome screen', async ({ page }) => {
		// Check title
		await expect(page).toHaveTitle(/DigitalGlue/);

		// Check menu bar
		await expect(page.getByText('File')).toBeVisible();
		await expect(page.getByText('Edit')).toBeVisible();
		await expect(page.getByText('View')).toBeVisible();

		// Check empty state
		await expect(page.getByText('Welcome to DigitalGlue')).toBeVisible();
		await expect(page.getByText('Load source images')).toBeVisible();
	});

	test('should load source images', async ({ page }) => {
		// Find source 1 file input
		const source1Input = page.locator('input[type="file"]').first();

		// Upload test image (using sample from repo)
		const samplePath = path.join(process.cwd(), 'samples', '140-pana_med_hr.jpeg');
		await source1Input.setInputFiles(samplePath);

		// Wait for image to load and appear in preview
		await expect(page.locator('.source-preview img').first()).toBeVisible({ timeout: 5000 });

		// Check that canvas is no longer showing empty state
		await expect(page.getByText('Welcome to DigitalGlue')).not.toBeVisible();

		// Canvas should be visible
		await expect(page.locator('canvas')).toBeVisible();
	});

	test('should load two sources and show both', async ({ page }) => {
		const inputs = page.locator('input[type="file"]');

		// Load source 1
		const sample1 = path.join(process.cwd(), 'samples', '140-pana_med_hr.jpeg');
		await inputs.nth(0).setInputFiles(sample1);
		await page.waitForTimeout(1000); // Let it process

		// Load source 2
		const sample2 = path.join(process.cwd(), 'samples', '142-alg_med_hr.jpeg');
		await inputs.nth(1).setInputFiles(sample2);
		await page.waitForTimeout(1000);

		// Both preview images should be visible
		const previews = page.locator('.source-preview img');
		await expect(previews).toHaveCount(2);
	});

	test('should select different mask patterns', async ({ page }) => {
		// Load an image first
		const source1Input = page.locator('input[type="file"]').first();
		const samplePath = path.join(process.cwd(), 'samples', '140-pana_med_hr.jpeg');
		await source1Input.setInputFiles(samplePath);
		await page.waitForTimeout(1000);

		// Find mask panel patterns
		const patterns = page.locator('.pattern-btn');
		const patternCount = await patterns.count();
		expect(patternCount).toBeGreaterThan(0);

		// Click on different patterns
		await patterns.nth(1).click();
		await page.waitForTimeout(500);

		// Pattern should be selected
		await expect(patterns.nth(1)).toHaveClass(/selected/);

		// Try another pattern
		await patterns.nth(2).click();
		await page.waitForTimeout(500);
		await expect(patterns.nth(2)).toHaveClass(/selected/);
	});

	test('should adjust image brightness', async ({ page }) => {
		// Load image
		const source1Input = page.locator('input[type="file"]').first();
		const samplePath = path.join(process.cwd(), 'samples', '140-pana_med_hr.jpeg');
		await source1Input.setInputFiles(samplePath);
		await page.waitForTimeout(1000);

		// Find brightness slider
		const brightnessSlider = page.locator('input[type="range"]').filter({ hasText: /Brightness/i }).first();

		// Adjust brightness
		await brightnessSlider.fill('50');
		await page.waitForTimeout(500);

		// Value should update
		const brightnessValue = page.locator('.control-value').filter({ hasText: '50' });
		await expect(brightnessValue).toBeVisible();
	});

	test('should pan and zoom the canvas', async ({ page }) => {
		// Load image
		const source1Input = page.locator('input[type="file"]').first();
		const samplePath = path.join(process.cwd(), 'samples', '140-pana_med_hr.jpeg');
		await source1Input.setInputFiles(samplePath);
		await page.waitForTimeout(1000);

		const canvas = page.locator('canvas');

		// Simulate mouse wheel zoom
		await canvas.hover();
		await canvas.dispatchEvent('wheel', { deltaY: -100 });
		await page.waitForTimeout(300);

		// Zoom indicator should appear
		await expect(page.locator('.zoom-indicator')).toBeVisible();

		// Check zoom percentage changed
		const zoomText = await page.locator('.zoom-indicator').textContent();
		expect(zoomText).not.toBe('100%');
	});

	test('should use menu to undo/redo', async ({ page }) => {
		// Load image
		const source1Input = page.locator('input[type="file"]').first();
		const samplePath = path.join(process.cwd(), 'samples', '140-pana_med_hr.jpeg');
		await source1Input.setInputFiles(samplePath);
		await page.waitForTimeout(1000);

		// Make a change (select a pattern)
		const patterns = page.locator('.pattern-btn');
		await patterns.nth(1).click();
		await page.waitForTimeout(500);

		// Open Edit menu
		await page.getByRole('button', { name: 'Edit' }).click();

		// Click Undo
		await page.getByRole('menuitem', { name: /Undo/ }).click();
		await page.waitForTimeout(500);

		// Pattern should be deselected (back to first pattern)
		await expect(patterns.nth(0)).toHaveClass(/selected/);
	});

	test('should use zoom menu controls', async ({ page }) => {
		// Load image
		const source1Input = page.locator('input[type="file"]').first();
		const samplePath = path.join(process.cwd(), 'samples', '140-pana_med_hr.jpeg');
		await source1Input.setInputFiles(samplePath);
		await page.waitForTimeout(1000);

		// Open View menu
		await page.getByRole('button', { name: 'View' }).click();

		// Click Zoom In
		await page.getByRole('menuitem', { name: /Zoom In/ }).click();
		await page.waitForTimeout(500);

		// Zoom indicator should show >100%
		await expect(page.locator('.zoom-indicator')).toBeVisible();
		const zoomText = await page.locator('.zoom-indicator').textContent();
		expect(parseInt(zoomText || '100')).toBeGreaterThan(100);
	});

	test('should toggle mask invert', async ({ page }) => {
		// Load two images
		const inputs = page.locator('input[type="file"]');
		const sample1 = path.join(process.cwd(), 'samples', '140-pana_med_hr.jpeg');
		const sample2 = path.join(process.cwd(), 'samples', '142-alg_med_hr.jpeg');

		await inputs.nth(0).setInputFiles(sample1);
		await page.waitForTimeout(1000);
		await inputs.nth(1).setInputFiles(sample2);
		await page.waitForTimeout(1000);

		// Find invert checkbox
		const invertCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /Invert/i });

		// Toggle invert
		await invertCheckbox.check();
		await page.waitForTimeout(500);

		// Should be checked
		await expect(invertCheckbox).toBeChecked();
	});
});
