import { describe, expect, it } from 'vitest';

import { toClearableId } from './toClearableId';

describe('toClearableId', () => {
  it('leaves the column alone when the draft never carried the field', () => {
    expect(toClearableId(undefined)).toBeUndefined();
  });

  it('clears the column when the user emptied the select', () => {
    expect(toClearableId('')).toBeNull();
    expect(toClearableId(null)).toBeNull();
  });

  it('passes a real id through', () => {
    expect(toClearableId('61')).toBe('61');
  });
});
