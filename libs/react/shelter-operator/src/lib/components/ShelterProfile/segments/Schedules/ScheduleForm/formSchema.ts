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
    _id: z.string(),
    // The saved row this range came from. Declared so the parsed form values
    // keep it: zod drops undeclared keys, and losing it turns every save into a
    // delete-and-recreate.
    serverId: z.string().optional(),
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

/**
 * Two ranges on one day cannot start at the same time: the stored key is
 * `(shelter, schedule type, day, start time, start date)`, so the second one is
 * a duplicate the API would refuse. Flag it in the form instead.
 */
const noDuplicateStarts = (
  ranges: { startTime: string }[],
  ctx: z.RefinementCtx,
  pathPrefix: (string | number)[],
) => {
  const firstIndexByStart = new Map<string, number>();

  ranges.forEach((range, index) => {
    const firstIndex = firstIndexByStart.get(range.startTime);

    if (firstIndex === undefined) {
      firstIndexByStart.set(range.startTime, index);
      return;
    }

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Another range already starts at ${range.startTime}`,
      path: [...pathPrefix, index, 'startTime'],
    });
  });
};

export const weeklyFormStateSchema = z
  .record(z.enum(DayOfWeekChoices), dayScheduleSchema)
  .superRefine((weekly, ctx) => {
    for (const [day, schedule] of Object.entries(weekly)) {
      noDuplicateStarts(schedule.ranges, ctx, [day, 'ranges']);
    }
  });

// Exception Schedules

const exceptionBaseFields = {
  localId: z.string(),
  serverId: z.string().optional(),
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

/**
 * Exception rows are keyed by date and start time too, so two entries covering
 * the same date at the same starting time are the same row to the API.
 */
const exceptionListSchema = z
  .array(exceptionEntrySchema)
  .superRefine((entries, ctx) => {
    const firstIndexByStart = new Map<string, number>();

    entries.forEach((entry, index) => {
      const key = `${entry.startDate} ${entry.closedAllDay ? '' : entry.startTime}`;
      const firstIndex = firstIndexByStart.get(key);

      if (firstIndex === undefined) {
        firstIndexByStart.set(key, index);
        return;
      }

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Another exception already covers this date and start time',
        path: [index, 'startTime'],
      });
    });
  });

export const scheduleFormSchema = z.object({
  weekly: weeklyFormStateSchema,
  exceptions: exceptionListSchema,
});

export type ScheduleFormData = z.infer<typeof scheduleFormSchema>;
