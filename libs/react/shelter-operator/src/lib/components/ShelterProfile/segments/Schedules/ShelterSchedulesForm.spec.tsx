import {
  ScheduleTypeChoices,
  type ScheduleType,
} from '@monorepo/react/shelter';
import { fireEvent, render, screen } from '@testing-library/react';
import { ShelterSchedulesForm } from './ShelterSchedulesForm';

// The schedule editor is a large component with its own concerns; these cases
// are about the wrapper: filtering by schedule type, pass-through, and the
// remount that resets the editor when the type changes.
vi.mock('./ScheduleForm', async () => {
  const { useState } = await import('react');

  return {
    ScheduleForm: (props: {
      scheduleType: string;
      initialSchedules: ScheduleType[];
      onSave: (inputs: unknown[]) => void;
      onDelete?: () => void;
    }) => {
      // Local state stands in for the editor's in-progress edits: it only
      // disappears if this component actually remounts.
      const [isDirty, setDirty] = useState(false);

      return (
        <div
          data-testid="schedule-form"
          data-schedule-ids={props.initialSchedules
            .map((schedule) => schedule.id)
            .join()}
          data-dirty={String(isDirty)}
        >
          <button onClick={() => setDirty(true)}>mark dirty</button>
          <button onClick={() => props.onSave(['sentinel'])}>save</button>
          {props.onDelete && <button onClick={props.onDelete}>delete</button>}
        </div>
      );
    },
  };
});

const schedule = (
  id: string,
  scheduleType: ScheduleTypeChoices,
): ScheduleType => ({ id, scheduleType, isException: false }) as ScheduleType;

const SCHEDULES = [
  schedule('operating-1', ScheduleTypeChoices.Operating),
  schedule('meal-1', ScheduleTypeChoices.MealService),
  schedule('operating-2', ScheduleTypeChoices.Operating),
];

const scheduleForm = () => screen.getByTestId('schedule-form');

describe('ShelterSchedulesForm', () => {
  it('passes only the schedules matching the schedule type', () => {
    render(
      <ShelterSchedulesForm
        scheduleType={ScheduleTypeChoices.Operating}
        schedules={SCHEDULES}
        onSave={vi.fn()}
      />,
    );

    expect(scheduleForm().getAttribute('data-schedule-ids')).toBe(
      'operating-1,operating-2',
    );
  });

  it('forwards the save and delete callbacks', () => {
    const onSave = vi.fn();
    const onDelete = vi.fn();

    render(
      <ShelterSchedulesForm
        scheduleType={ScheduleTypeChoices.Operating}
        schedules={SCHEDULES}
        onSave={onSave}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'save' }));
    fireEvent.click(screen.getByRole('button', { name: 'delete' }));

    expect(onSave).toHaveBeenCalledWith(['sentinel']);
    expect(onDelete).toHaveBeenCalled();
  });

  it('does not render a delete control when onDelete is absent', () => {
    render(
      <ShelterSchedulesForm
        scheduleType={ScheduleTypeChoices.Operating}
        schedules={SCHEDULES}
        onSave={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'delete' })).toBeNull();
  });

  it('remounts the editor when the schedule type changes', () => {
    const { rerender } = render(
      <ShelterSchedulesForm
        scheduleType={ScheduleTypeChoices.Operating}
        schedules={SCHEDULES}
        onSave={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'mark dirty' }));

    expect(scheduleForm().getAttribute('data-dirty')).toBe('true');

    rerender(
      <ShelterSchedulesForm
        scheduleType={ScheduleTypeChoices.MealService}
        schedules={SCHEDULES}
        onSave={vi.fn()}
      />,
    );

    // A remount means the previous type's in-progress edits are gone.
    expect(scheduleForm().getAttribute('data-dirty')).toBe('false');
    expect(scheduleForm().getAttribute('data-schedule-ids')).toBe('meal-1');
  });
});
