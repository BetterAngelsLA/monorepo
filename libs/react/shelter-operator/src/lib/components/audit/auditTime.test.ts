import {
  formatAuditTimestamp,
  formatAuditTimestampAbsolute,
} from './auditTime';

describe('audit timestamps', () => {
  it('renders a full ISO datetime relative to now', () => {
    expect(formatAuditTimestamp('2020-01-01T12:00:00Z')).toMatch(/ago$/);
  });

  it('renders an absolute value for the tooltip', () => {
    expect(formatAuditTimestampAbsolute('2020-01-01T12:00:00Z')).not.toBe('');
  });

  it('rejects partial, invalid, and missing values', () => {
    expect(formatAuditTimestamp('2020')).toBe('');
    expect(formatAuditTimestamp('2020-05')).toBe('');
    expect(formatAuditTimestamp('not-a-date')).toBe('');
    expect(formatAuditTimestampAbsolute(null)).toBe('');
    expect(formatAuditTimestampAbsolute(undefined)).toBe('');
  });
});
