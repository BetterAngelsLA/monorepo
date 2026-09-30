import { render } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { Text } from 'react-native';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { HmisProdClientHistoryItem } from '../../../../api';
import { HistoryCard } from './HistoryCard';

vi.mock('@monorepo/expo/shared/icons', () => ({
  CircleSolidIcon: () => null,
}));

vi.mock('@monorepo/expo/shared/ui-components', () => ({
  TextBold: ({ children }: { children: ReactNode }) => <Text>{children}</Text>,
  TextRegular: ({ children }: { children: ReactNode }) => (
    <Text>{children}</Text>
  ),
}));

// Sep 30 2026, 15:30 local — the humanized expectations are relative to this.
const NOW = new Date(2026, 8, 30, 15, 30);

const renderCard = (item: HmisProdClientHistoryItem) =>
  render(<HistoryCard item={item} />);

describe('HistoryCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders an active entry with the dot, start date and "End: active"', () => {
    const { getByLabelText, getByText } = renderCard({
      id: 1,
      type: 'service',
      data: {
        name: 'Outreach',
        agency: 'Agency A',
        agency_message: 'Check-in',
        start_date: '2026-09-28',
        end_date: null,
      },
    });

    expect(getByText('Outreach')).toBeTruthy();
    expect(getByText('Service')).toBeTruthy();
    expect(getByText('Agency: Agency A')).toBeTruthy();
    expect(getByText('Check-in')).toBeTruthy();
    expect(getByText('Start: 09/28/2026 (2 days ago)')).toBeTruthy();
    expect(getByText('End: active')).toBeTruthy();
    expect(getByLabelText('Currently active')).toBeTruthy();
  });

  it('marks an entry starting today as active', () => {
    const { getByLabelText, getByText } = renderCard({
      id: 4,
      type: 'service',
      data: {
        name: 'Same-day Service',
        start_date: '2026-09-30',
        end_date: null,
      },
    });

    expect(getByText('Start: 09/30/2026 (today)')).toBeTruthy();
    expect(getByText('End: active')).toBeTruthy();
    expect(getByLabelText('Currently active')).toBeTruthy();
  });

  it('does not mark an entry active until its start date is reached', () => {
    const { getByText, queryByLabelText, queryByText } = renderCard({
      id: 5,
      type: 'service',
      data: {
        name: 'Upcoming Service',
        start_date: '2026-10-05',
        end_date: null,
      },
    });

    // The humanizer clamps future dates to `today`; only the active state is
    // gated on the start date having been reached.
    expect(getByText('Start: 10/05/2026 (today)')).toBeTruthy();
    expect(getByText('End: —')).toBeTruthy();
    expect(queryByText('End: active')).toBeNull();
    expect(queryByLabelText('Currently active')).toBeNull();
  });

  it('does not mark an entry active when there is no start date', () => {
    const { getByText, queryByLabelText, queryByText } = renderCard({
      id: 6,
      type: 'demographic',
      data: {
        name: 'No Dates',
        start_date: null,
        end_date: null,
      },
    });

    expect(getByText('Start: —')).toBeTruthy();
    expect(getByText('End: —')).toBeTruthy();
    expect(queryByText('End: active')).toBeNull();
    expect(queryByLabelText('Currently active')).toBeNull();
  });

  it('renders a completed entry with its end date and no active indicators', () => {
    const { getByText, queryByLabelText, queryByText } = renderCard({
      id: 2,
      type: 'program',
      data: {
        name: 'Housing',
        start_date: '2026-09-01',
        end_date: '2026-09-29',
      },
    });

    expect(getByText('Program')).toBeTruthy();
    expect(getByText('Start: 09/01/2026 (4 weeks ago)')).toBeTruthy();
    expect(getByText('End: 09/29/2026 (yesterday)')).toBeTruthy();
    expect(queryByText('End: active')).toBeNull();
    expect(queryByLabelText('Currently active')).toBeNull();
  });

  it('falls back to raw values for unparseable dates and a placeholder for a missing name', () => {
    const { getByText, queryByLabelText } = renderCard({
      id: 3,
      type: 'demographic',
      data: {
        name: null,
        start_date: 'not-a-date',
        end_date: 'also-bad',
      },
    });

    expect(getByText('Demographic')).toBeTruthy();
    expect(getByText('—')).toBeTruthy();
    expect(getByText('Start: not-a-date')).toBeTruthy();
    expect(getByText('End: also-bad')).toBeTruthy();
    expect(queryByLabelText('Currently active')).toBeNull();
  });
});
