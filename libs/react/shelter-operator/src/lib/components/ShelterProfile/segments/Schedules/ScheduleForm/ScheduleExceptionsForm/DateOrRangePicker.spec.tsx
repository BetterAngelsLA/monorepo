import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import type { ExceptionEntry } from '../types';
import { DateOrRangePicker } from './DateOrRangePicker';

type TPickerState = Pick<
  ExceptionEntry,
  'startDate' | 'endDate' | 'isDateRange'
>;

const SINGLE_DAY: TPickerState = {
  startDate: '',
  endDate: '',
  isDateRange: false,
};

const DATE_RANGE: TPickerState = {
  startDate: '2026-12-24',
  endDate: '2026-12-26',
  isDateRange: true,
};

function Harness({ initial }: { initial: TPickerState }) {
  const [state, setState] = useState(initial);

  return (
    <>
      <DateOrRangePicker
        isDateRange={state.isDateRange}
        startDate={state.startDate}
        endDate={state.endDate}
        onChange={(patch) => setState((prev) => ({ ...prev, ...patch }))}
      />
      <output data-testid="state">
        {state.startDate}|{state.endDate}|{String(state.isDateRange)}
      </output>
    </>
  );
}

const pickerState = () => screen.getByTestId('state').textContent;

const dateInput = (label: string) =>
  screen.getByLabelText(label) as HTMLInputElement;

const setDate = (label: string, value: string) =>
  fireEvent.change(dateInput(label), { target: { value } });

const addEndDate = () =>
  fireEvent.click(screen.getByRole('button', { name: /add end date/i }));

describe('DateOrRangePicker', () => {
  it('shows a single date field by default', () => {
    render(<Harness initial={SINGLE_DAY} />);

    expect(dateInput('Date')).toBeTruthy();
    expect(screen.queryByLabelText('End date')).toBeNull();
  });

  it('does not reveal the end date field when a date is picked', () => {
    render(<Harness initial={SINGLE_DAY} />);

    setDate('Date', '2026-12-24');

    expect(screen.queryByLabelText('End date')).toBeNull();
    expect(dateInput('Date').value).toBe('2026-12-24');
    // The hidden end date mirrors the start date so the entry stays complete.
    expect(pickerState()).toBe('2026-12-24|2026-12-24|false');
  });

  it('adds the end date field when the add button is clicked', () => {
    render(<Harness initial={SINGLE_DAY} />);

    setDate('Date', '2026-12-24');
    addEndDate();

    expect(dateInput('Start date').value).toBe('2026-12-24');
    expect(dateInput('End date').value).toBe('2026-12-25');
    expect(pickerState()).toBe('2026-12-24|2026-12-25|true');
  });

  it('keeps the end date field when both ends are the same day', () => {
    render(<Harness initial={DATE_RANGE} />);

    setDate('Start date', '2026-12-26');
    setDate('End date', '2026-12-26');

    expect(screen.queryByLabelText('End date')).not.toBeNull();
    expect(dateInput('Start date').value).toBe('2026-12-26');
    expect(dateInput('End date').value).toBe('2026-12-26');
    expect(pickerState()).toBe('2026-12-26|2026-12-26|true');
  });

  it('collapses to a single day when the end date is removed', () => {
    render(<Harness initial={DATE_RANGE} />);

    fireEvent.click(screen.getByRole('button', { name: /remove end date/i }));

    expect(screen.queryByLabelText('End date')).toBeNull();
    expect(pickerState()).toBe('2026-12-24|2026-12-24|false');
  });
});
