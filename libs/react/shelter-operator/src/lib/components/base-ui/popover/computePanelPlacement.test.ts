import { describe, expect, it } from 'vitest';
import { computePanelPlacement } from './computePanelPlacement';

const VIEWPORT = { width: 1024, height: 768 };
const PANEL = { width: 320, height: 200 };
const OPTIONS = { gap: 6, margin: 8 };

function anchorAt(top: number, left = 100) {
  return { top, bottom: top + 48, left, right: left + 240 };
}

describe('computePanelPlacement', () => {
  it('places the panel below the anchor when there is room', () => {
    const result = computePanelPlacement(
      anchorAt(100),
      PANEL,
      VIEWPORT,
      OPTIONS,
    );

    expect(result).toEqual({ top: 154, left: 100, placement: 'below' });
  });

  it('flips above the anchor when the panel does not fit below', () => {
    const result = computePanelPlacement(
      anchorAt(600),
      PANEL,
      VIEWPORT,
      OPTIONS,
    );

    expect(result.placement).toBe('above');
    expect(result.top).toBe(600 - 200 - 6);
  });

  it('stays below when neither side fits but below has more room', () => {
    const result = computePanelPlacement(
      anchorAt(100),
      { width: 320, height: 700 },
      VIEWPORT,
      OPTIONS,
    );

    expect(result.placement).toBe('below');
    expect(result.top).toBe(60);
  });

  it('clamps left when the anchor is near the right edge', () => {
    const result = computePanelPlacement(
      anchorAt(100, 900),
      PANEL,
      VIEWPORT,
      OPTIONS,
    );

    expect(result.left).toBe(1024 - 320 - 8);
  });

  it('clamps left when the anchor is partly off-screen to the left', () => {
    const result = computePanelPlacement(
      anchorAt(100, -50),
      PANEL,
      VIEWPORT,
      OPTIONS,
    );

    expect(result.left).toBe(8);
  });

  it('clamps the panel to the top margin when it is taller than the viewport', () => {
    const result = computePanelPlacement(
      anchorAt(100),
      { width: 320, height: 900 },
      VIEWPORT,
      OPTIONS,
    );

    expect(result.top).toBe(8);
  });
});
