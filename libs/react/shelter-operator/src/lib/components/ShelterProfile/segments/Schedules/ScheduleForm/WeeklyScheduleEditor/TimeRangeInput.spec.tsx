import { render, screen } from '@testing-library/react';
import { TimeRangeInput } from './TimeRangeInput';

const renderRange = (startTime: string, endTime: string) =>
  render(
    <TimeRangeInput
      startTime={startTime}
      endTime={endTime}
      onChange={vi.fn()}
    />,
  );

describe('TimeRangeInput', () => {
  it('does not annotate a same-day range', () => {
    renderRange('09:00', '17:00');

    expect(screen.queryByText('Next day')).toBeNull();
    expect(
      screen.getByLabelText('End time').getAttribute('aria-describedby'),
    ).toBeNull();
  });

  it('annotates an overnight range on the end field', () => {
    renderRange('20:30', '07:30');

    const note = screen.getByText('Next day');
    const describedBy =
      screen.getByLabelText('End time').getAttribute('aria-describedby') ?? '';

    // Screen readers announce the note with the field it explains.
    expect(describedBy).toBe(note.id);
    expect(document.getElementById(describedBy)?.textContent).toBe('Next day');
  });

  it('does not annotate equal times', () => {
    renderRange('09:00', '09:00');

    expect(screen.queryByText('Next day')).toBeNull();
  });

  it('does not annotate a range with only a start time', () => {
    // '' < '20:30' is true, so an unguarded comparison would annotate here.
    renderRange('20:30', '');

    expect(screen.queryByText('Next day')).toBeNull();
  });

  it('does not annotate a range with only an end time', () => {
    renderRange('', '07:30');

    expect(screen.queryByText('Next day')).toBeNull();
  });
});
