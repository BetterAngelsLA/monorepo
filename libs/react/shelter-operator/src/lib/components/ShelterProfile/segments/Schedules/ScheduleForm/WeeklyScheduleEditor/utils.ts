import { DayOfWeekChoices } from '@monorepo/react/shelter';
import type { WeeklyFormState } from '../types';

export function buildDefaultWeeklyState(): WeeklyFormState {
  return Object.values(DayOfWeekChoices).reduce<WeeklyFormState>(
    (weeklyState, day) => ({
      ...weeklyState,
      [day]: { ranges: [] },
    }),
    {} as WeeklyFormState
  );
}
