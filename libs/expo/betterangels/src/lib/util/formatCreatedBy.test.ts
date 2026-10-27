import { describe, expect, it } from 'vitest';

import { formatCreatedBy } from './formatCreatedBy';

describe('formatCreatedBy', () => {
  it('joins the creator, organization and team', () => {
    expect(
      formatCreatedBy(
        { firstName: 'Paul', lastName: 'Vecchio' },
        { name: 'Echo Park Outreach' },
        { name: 'On-Site' },
      ),
    ).toBe('Created by Paul Vecchio · Echo Park Outreach · On-Site');
  });

  it('drops the affiliation when there is none', () => {
    expect(formatCreatedBy({ firstName: 'Paul', lastName: 'Vecchio' })).toBe(
      'Created by Paul Vecchio',
    );
  });

  it('survives a half-filled name', () => {
    expect(formatCreatedBy({ firstName: 'Paul', lastName: null })).toBe(
      'Created by Paul',
    );
  });

  it('returns an empty string with no creator, so the footer shows only the date', () => {
    expect(formatCreatedBy(null, { name: 'Echo Park Outreach' })).toBe('');
  });
});
