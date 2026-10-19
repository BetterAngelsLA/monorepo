import { describe, expect, it } from 'vitest';
import { lerpRgb, parseColor } from './mapColors';

describe('parseColor', () => {
  it('parses #rrggbb', () => {
    expect(parseColor('#1a2b3c')).toEqual([26, 43, 60]);
    expect(parseColor('#FFFFFF')).toEqual([255, 255, 255]);
    expect(parseColor('#000000')).toEqual([0, 0, 0]);
  });

  it('parses #rgb shorthand', () => {
    expect(parseColor('#fff')).toEqual([255, 255, 255]);
    expect(parseColor('#0f0')).toEqual([0, 255, 0]);
    expect(parseColor('#1A2')).toEqual([17, 170, 34]);
  });

  it('parses rgb()', () => {
    expect(parseColor('rgb(26, 43, 60)')).toEqual([26, 43, 60]);
    expect(parseColor('rgb(0,0,0)')).toEqual([0, 0, 0]);
  });

  it('parses rgba() and ignores the alpha', () => {
    // The layers carry alpha separately (or not at all), so only the colour components matter.
    expect(parseColor('rgba(26, 43, 60, 0.5)')).toEqual([26, 43, 60]);
    expect(parseColor('rgba(255, 255, 255, 1)')).toEqual([255, 255, 255]);
  });

  it('trims surrounding whitespace', () => {
    expect(parseColor('  #1a2b3c  ')).toEqual([26, 43, 60]);
  });

  it('falls back to mid grey on anything it cannot read', () => {
    // A CSS var or an unknown token must not throw and blank the whole overlay.
    expect(parseColor('var(--ant-color-primary)')).toEqual([128, 128, 128]);
    expect(parseColor('rebeccapurple')).toEqual([128, 128, 128]);
    expect(parseColor('')).toEqual([128, 128, 128]);
  });
});

describe('lerpRgb', () => {
  it('returns the endpoints unchanged', () => {
    expect(lerpRgb([0, 100, 200], [200, 0, 50], 0)).toEqual([0, 100, 200]);
    expect(lerpRgb([0, 100, 200], [200, 0, 50], 1)).toEqual([200, 0, 50]);
  });

  it('blends each channel', () => {
    expect(lerpRgb([0, 0, 0], [255, 255, 255], 0.5)).toEqual([128, 128, 128]);
  });
});
