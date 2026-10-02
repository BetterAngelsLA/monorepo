import { describe, expect, it } from 'vitest';
import { formatBucketLabel } from './formatBucketLabel';

describe('formatBucketLabel', () => {
  it('keeps the calendar day the backend bucketed on', () => {
    expect(formatBucketLabel('2025-01-31')).toBe('1/31');
    expect(formatBucketLabel('2025-02-01')).toBe('2/1');
  });

  it('passes through values it cannot parse', () => {
    expect(formatBucketLabel('')).toBe('');
    expect(formatBucketLabel('not-a-date')).toBe('not-a-date');
  });
});
