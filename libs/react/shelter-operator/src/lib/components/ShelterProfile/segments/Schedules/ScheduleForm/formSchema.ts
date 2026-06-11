import { ConditionChoices, DayOfWeekChoices } from '@monorepo/react/shelter';
import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const dateRegex = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;

// Reusable zod fields
const timeField = z.string().regex(timeRegex, 'Invalid time format (HH:MM)');
const dateField = z
  .string()
  .regex(dateRegex, 'Invalid date format (YYYY-MM-DD)');

// Standard Schedules

export const timeRangeSchema = z
  .object({
    startTime: timeField,
    endTime: timeField,
  })
  .refine((r) => r.startTime < r.endTime, {
    message: 'Start time must be before end time',
    path: ['endTime'],
  });

export const dayScheduleSchema = z.object({
  ranges: z.array(timeRangeSchema),
});

export const weeklyFormStateSchema = z.record(
  z.enum(DayOfWeekChoices),
  dayScheduleSchema
);

// Exception Schedules

const exceptionBaseFields = {
  localId: z.string(),
  startDate: dateField,
  endDate: dateField,
  condition: z.enum(ConditionChoices).optional(),
};

export const exceptionEntrySchema = z
  .discriminatedUnion('closedAllDay', [
    z.object({
      ...exceptionBaseFields,
      closedAllDay: z.literal(true),
      startTime: z.string(),
      endTime: z.string(),
    }),
    z
      .object({
        ...exceptionBaseFields,
        closedAllDay: z.literal(false),
        startTime: timeField,
        endTime: timeField,
      })
      .refine((e) => e.startTime < e.endTime, {
        message: 'Start time must be before end time',
        path: ['endTime'],
      }),
  ])
  .refine((e) => e.startDate <= e.endDate, {
    message: 'Start date must be on or before end date',
    path: ['endDate'],
  });

export const scheduleFormSchema = z.object({
  weekly: weeklyFormStateSchema,
  exceptions: z.array(exceptionEntrySchema),
});

export type ScheduleFormData = z.infer<typeof scheduleFormSchema>;
