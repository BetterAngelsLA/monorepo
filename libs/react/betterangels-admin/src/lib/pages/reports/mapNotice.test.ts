import { describe, expect, it } from 'vitest';
import { mapNotice } from './mapNotice';

const base = {
  hasMapsKey: true,
  refused: false,
  failed: false,
  tileFaulted: false,
};

describe('the map panel notice', () => {
  it('shows nothing when the map is drawable', () => {
    expect(mapNotice(base)).toBe('none');
  });

  it('explains a missing Maps key before anything else', () => {
    // Nothing can be drawn without a key, so it is the actionable answer even if the query
    // also refused.
    expect(mapNotice({ ...base, hasMapsKey: false, refused: true })).toBe(
      'no-key',
    );
  });

  it('prefers a refusal over a fault', () => {
    expect(mapNotice({ ...base, refused: true, failed: true })).toBe('refused');
  });

  it('prefers a fault over a tile fault', () => {
    expect(mapNotice({ ...base, failed: true, tileFaulted: true })).toBe(
      'failed',
    );
  });

  it('reports a tile fault without replacing the map', () => {
    // The caller keeps the map mounted for this one — that is what lets a later tile clear it.
    expect(mapNotice({ ...base, tileFaulted: true })).toBe('tile-fault');
  });
});
