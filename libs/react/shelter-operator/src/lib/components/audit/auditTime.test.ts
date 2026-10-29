import {
  formatAuditTimestamp,
  formatAuditTimestampAbsolute,
} from './auditTime';

describe('audit timestamps', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:01:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a full ISO datetime relative to now', () => {
    expect(formatAuditTimestamp('2026-01-01T00:00:00Z')).toBe('1 minute ago');
  });

  it('renders the exact absolute value for the tooltip', () => {
    expect(formatAuditTimestampAbsolute('2020-01-01T12:00:00Z')).toBe(
      new Date('2020-01-01T12:00:00Z').toLocaleString(),
    );
  });

  it('rejects partial, invalid, and missing values', () => {
    expect(formatAuditTimestamp('2020')).toBe('');
    expect(formatAuditTimestamp('2020-05')).toBe('');
    expect(formatAuditTimestamp('not-a-date')).toBe('');
    expect(formatAuditTimestampAbsolute(null)).toBe('');
    expect(formatAuditTimestampAbsolute(undefined)).toBe('');
  });
});
