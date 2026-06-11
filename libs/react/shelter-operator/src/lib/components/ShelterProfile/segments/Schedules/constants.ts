import { ScheduleTypeChoices } from '@monorepo/react/shelter';

export const SCHEDULE_TABS: ScheduleTypeChoices[] = [
  ScheduleTypeChoices.Operating,
  ScheduleTypeChoices.Intake,
  ScheduleTypeChoices.MealService,
  ScheduleTypeChoices.StaffAvailability,
];

export const SCHEDULE_TAB_LABELS: Record<ScheduleTypeChoices, string> = {
  [ScheduleTypeChoices.Operating]: 'Operating Hours',
  [ScheduleTypeChoices.Intake]: 'Intake Hours',
  [ScheduleTypeChoices.MealService]: 'Meal Service',
  [ScheduleTypeChoices.StaffAvailability]: 'Staff Availability',
};
