import { render } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { Text } from 'react-native';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { HmisProdClientProgramItem } from '../../../../api';
import { ProgramCard } from './ProgramCard';

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

const renderCard = async (item: HmisProdClientProgramItem) =>
  await render(<ProgramCard item={item} />);

const activeItem: HmisProdClientProgramItem = {
  id: 583,
  start_date: '2026-09-28',
  end_date: null,
  program: {
    name: 'Test Program 01',
    agency: { name: 'Agency A' },
    category: { value_name: 'Other' },
  },
  agency: { name: 'Agency A' },
};

describe('ProgramCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders an active program with the dot, category, agency and "Exit: active"', async () => {
    const { getByLabelText, getByText } = await renderCard(activeItem);

    expect(getByText('Test Program 01')).toBeTruthy();
    expect(getByText('Other')).toBeTruthy();
    expect(getByText('Agency: Agency A')).toBeTruthy();
    expect(getByText('Entry: 09/28/2026 (2 days ago)')).toBeTruthy();
    expect(getByText('Exit: active')).toBeTruthy();
    expect(getByLabelText('Currently active')).toBeTruthy();
  });

  it('marks a program starting today as active', async () => {
    const { getByLabelText, getByText } = await renderCard({
      ...activeItem,
      start_date: '2026-09-30',
    });

    expect(getByText('Entry: 09/30/2026 (today)')).toBeTruthy();
    expect(getByText('Exit: active')).toBeTruthy();
    expect(getByLabelText('Currently active')).toBeTruthy();
  });

  it('does not mark a program active until its start date is reached', async () => {
    const { getByText, queryByLabelText, queryByText } = await renderCard({
      ...activeItem,
      start_date: '2026-10-05',
    });

    // The humanizer clamps future dates to `today`; only the active state is
    // gated on the start date having been reached.
    expect(getByText('Entry: 10/05/2026 (today)')).toBeTruthy();
    expect(getByText('Exit: —')).toBeTruthy();
    expect(queryByText('Exit: active')).toBeNull();
    expect(queryByLabelText('Currently active')).toBeNull();
  });

  it('renders a completed program with its end date and no active indicators', async () => {
    const { getByText, queryByLabelText, queryByText } = await renderCard({
      ...activeItem,
      end_date: '2026-09-29',
    });

    expect(getByText('Exit: 09/29/2026 (yesterday)')).toBeTruthy();
    expect(queryByText('Exit: active')).toBeNull();
    expect(queryByLabelText('Currently active')).toBeNull();
  });

  it('falls back to a placeholder for a missing program and hides empty rows', async () => {
    const { getAllByText, getByText, queryByText } = await renderCard({
      id: 42,
      start_date: null,
      end_date: null,
    });

    // Name, entry and exit are all missing, so the placeholder repeats.
    expect(getAllByText('—').length).toBeGreaterThan(0);
    expect(getByText('Entry: —')).toBeTruthy();
    expect(getByText('Exit: —')).toBeTruthy();
    expect(queryByText(/Agency:/)).toBeNull();
  });

  it('falls back to raw values for unparseable dates', async () => {
    const { getByText } = await renderCard({
      ...activeItem,
      start_date: 'not-a-date',
      end_date: 'also-bad',
    });

    expect(getByText('Entry: not-a-date')).toBeTruthy();
    expect(getByText('Exit: also-bad')).toBeTruthy();
  });
});
