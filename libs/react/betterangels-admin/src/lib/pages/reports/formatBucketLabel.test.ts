import { describe, expect, it } from 'vitest';
import { formatBucketLabel } from './formatBucketLabel';

// These expectations are the same on every machine, and that is the point.  The
// regression this covers — `new Date('2025-01-31')` rendering as 1/30 — only
// reproduces west of UTC, so a test that depended on the ambient zone would pass
// on a UTC CI runner while the bug was live for users in Los Angeles.
describe('formatBucketLabel', () => {
  it('renders the day the backend bucketed on', () => {
    expect(formatBucketLabel('2025-01-31')).toBe('1/31');
    expect(formatBucketLabel('2025-02-01')).toBe('2/1');
    expect(formatBucketLabel('2025-12-09')).toBe('12/9');
  });

  it('does not shift the day across a year boundary', () => {
    expect(formatBucketLabel('2025-01-01')).toBe('1/1');
    expect(formatBucketLabel('2024-12-31')).toBe('12/31');
  });

  it('passes through values it cannot parse', () => {
    expect(formatBucketLabel('')).toBe('');
    expect(formatBucketLabel('not-a-date')).toBe('not-a-date');
    expect(formatBucketLabel('2025-1-31')).toBe('2025-1-31');
  });
});
