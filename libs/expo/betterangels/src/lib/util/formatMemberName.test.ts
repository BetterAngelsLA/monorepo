import { describe, expect, it } from 'vitest';
import { formatMemberName } from './formatMemberName';

describe('formatMemberName', () => {
  it('joins the parts that exist', () => {
    expect(formatMemberName({ firstName: 'Michelle', lastName: 'Choi' })).toBe(
      'Michelle Choi',
    );
  });

  it('does not leave a separator for a missing part', () => {
    expect(formatMemberName({ firstName: 'Michelle', lastName: null })).toBe(
      'Michelle',
    );
    expect(formatMemberName({ firstName: null, lastName: 'Choi' })).toBe(
      'Choi',
    );
  });

  it('returns an empty string when there is no name at all', () => {
    expect(formatMemberName({ firstName: null, lastName: null })).toBe('');
    expect(formatMemberName(null)).toBe('');
  });
});
