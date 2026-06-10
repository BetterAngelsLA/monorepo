import { DayOfWeekChoices } from '@monorepo/react/shelter';
import type { WeeklyFormState } from '../types';

export function buildDefaultWeeklyState(): WeeklyFormState {
  return Object.fromEntries(
    Object.values(DayOfWeekChoices).map((day) => [day, { ranges: [] }])
  ) as WeeklyFormState;
}
