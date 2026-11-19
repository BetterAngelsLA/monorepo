import {
  DayOfWeekChoices,
  ScheduleTypeChoices,
  type ScheduleType,
} from '@monorepo/react/shelter';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ScheduleForm } from './ScheduleForm';

const savedOvernightRow = {
  id: 'mon-night',
  scheduleType: ScheduleTypeChoices.Operating,
  day: DayOfWeekChoices.Monday,
  isException: false,
  startTime: '20:30:00',
  endTime: '07:30:00',
} as ScheduleType;

const timeValue = (label: 'Start time' | 'End time') =>
  (screen.getByLabelText(label) as HTMLInputElement).value;

describe('ScheduleForm', () => {
  it('loads a saved overnight range and saves it back unchanged', async () => {
    const onSave = vi.fn();

    render(
      <ScheduleForm
        scheduleType={ScheduleTypeChoices.Operating}
        initialSchedules={[savedOvernightRow]}
        onSave={onSave}
      />,
    );

    expect(timeValue('Start time')).toBe('20:30');
    expect(timeValue('End time')).toBe('07:30');

    fireEvent.click(screen.getByRole('button', { name: 'Save Schedule' }));

    // Rejecting the range blocks the save entirely, so reaching onSave is the
    // assertion that an existing overnight row is still saveable.
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));

    expect(screen.queryByText('Start time must be before end time')).toBeNull();
    expect(onSave.mock.calls[0][0]).toEqual([
      expect.objectContaining({
        id: 'mon-night',
        startTime: '20:30:00',
        endTime: '07:30:00',
      }),
    ]);
  });

  it('still blocks a range with a missing time', async () => {
    const onSave = vi.fn();

    render(
      <ScheduleForm
        scheduleType={ScheduleTypeChoices.Operating}
        initialSchedules={[]}
        onSave={onSave}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Monday' }));
    fireEvent.change(screen.getByLabelText('Start time'), {
      target: { value: '20:30' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save Schedule' }));

    // Dropping the ordering rule must not drop the only remaining time check.
    await waitFor(() =>
      expect(screen.queryByText('Invalid time format (HH:MM)')).not.toBeNull(),
    );

    expect(onSave).not.toHaveBeenCalled();
  });

  it('rejects a range whose times are equal', async () => {
    const onSave = vi.fn();

    render(
      <ScheduleForm
        scheduleType={ScheduleTypeChoices.Operating}
        initialSchedules={[]}
        onSave={onSave}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Monday' }));
    fireEvent.change(screen.getByLabelText('Start time'), {
      target: { value: '09:00' },
    });
    fireEvent.change(screen.getByLabelText('End time'), {
      target: { value: '09:00' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save Schedule' }));

    await waitFor(() =>
      expect(
        screen.queryByText("Start and end time can't be the same"),
      ).not.toBeNull(),
    );

    expect(onSave).not.toHaveBeenCalled();
  });

  it('marks an overnight range as ending the next day, and only those', () => {
    const daytimeRow = {
      ...savedOvernightRow,
      id: 'mon-day',
      startTime: '09:00:00',
      endTime: '17:00:00',
    };

    const { unmount } = render(
      <ScheduleForm
        scheduleType={ScheduleTypeChoices.Operating}
        initialSchedules={[savedOvernightRow]}
        onSave={vi.fn()}
      />,
    );

    // Without this, 8:30 PM - 7:30 AM is ambiguous to whoever enters it.
    expect(screen.queryByText('Next day')).not.toBeNull();

    unmount();

    // A same-day range must not carry the label; without this the assertion
    // above would pass even if the end-before-start detection were dropped.
    render(
      <ScheduleForm
        scheduleType={ScheduleTypeChoices.Operating}
        initialSchedules={[daytimeRow]}
        onSave={vi.fn()}
      />,
    );

    expect(screen.queryByText('Next day')).toBeNull();
  });

  it('saves an overnight range typed into a day', async () => {
    const onSave = vi.fn();

    render(
      <ScheduleForm
        scheduleType={ScheduleTypeChoices.Operating}
        initialSchedules={[]}
        onSave={onSave}
      />,
    );

    // Turning a day on gives it one empty range to fill in.
    fireEvent.click(screen.getByRole('button', { name: 'Monday' }));

    fireEvent.change(screen.getByLabelText('Start time'), {
      target: { value: '20:30' },
    });
    fireEvent.change(screen.getByLabelText('End time'), {
      target: { value: '07:30' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save Schedule' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));

    expect(screen.queryByText('Start time must be before end time')).toBeNull();
    expect(onSave.mock.calls[0][0]).toEqual([
      expect.objectContaining({
        days: [DayOfWeekChoices.Monday],
        startTime: '20:30:00',
        endTime: '07:30:00',
      }),
    ]);
  });
});
