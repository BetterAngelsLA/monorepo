import { DayOfWeekChoices } from '@monorepo/react/shelter';
import { fireEvent, render, screen } from '@testing-library/react';
import { buildDefaultWeeklyState } from './utils';
import { WeeklyScheduleEditor } from './WeeklyScheduleEditor';
import type { WeeklyFormState } from '../types';

function stateWithWednesday(): WeeklyFormState {
  const state = buildDefaultWeeklyState();

  state[DayOfWeekChoices.Wednesday].ranges = [
    {
      _id: 'row-wed',
      serverId: 'row-wed',
      startTime: '06:00',
      endTime: '18:00',
    },
  ];

  return state;
}

describe('WeeklyScheduleEditor', () => {
  it('copies a saved range to the other days without its row id', () => {
    const onChange = vi.fn();

    render(
      <WeeklyScheduleEditor value={stateWithWednesday()} onChange={onChange} />,
    );

    fireEvent.click(screen.getAllByTitle('Copy these hours to all days')[0]);

    const next = onChange.mock.calls[0][0] as WeeklyFormState;

    // The copies are new rows: keeping the id would make the payload name the
    // same schedule twice, which the API rejects.
    for (const day of Object.values(DayOfWeekChoices)) {
      if (day === DayOfWeekChoices.Wednesday) {
        continue;
      }

      expect(next[day].ranges).toHaveLength(1);
      expect(next[day].ranges[0]).toMatchObject({
        startTime: '06:00',
        endTime: '18:00',
      });
      expect(next[day].ranges[0].serverId).toBeUndefined();
    }

    // The source day keeps the row it came from.
    expect(next[DayOfWeekChoices.Wednesday].ranges[0].serverId).toBe('row-wed');
  });
});
