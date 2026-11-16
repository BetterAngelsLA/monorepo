import {
  formatAuditTimestamp,
  formatAuditTimestampAbsolute,
} from './auditTime';

const options: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
};

describe('audit timestamps', () => {
  it('renders the full localized date and time inline', () => {
    const value = '2020-01-01T12:00:00Z';

    expect(formatAuditTimestamp(value)).toBe(
      new Date(value).toLocaleString(undefined, options),
    );
    expect(formatAuditTimestamp(value)).not.toMatch(/ago$/);
  });

  it('renders the same full localized value for the tooltip', () => {
    expect(formatAuditTimestampAbsolute('2020-01-01T12:00:00Z')).toBe(
      new Date('2020-01-01T12:00:00Z').toLocaleString(undefined, options),
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
