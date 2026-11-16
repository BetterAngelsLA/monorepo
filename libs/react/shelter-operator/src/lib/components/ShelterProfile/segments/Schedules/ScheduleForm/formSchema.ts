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
    // Round-tripped, not edited: declared so parsing keeps them and the save
    // does not clear a condition or seasonal bound the weekly UI cannot show.
    condition: z.enum(ConditionChoices).optional(),
    startDate: dateField.optional(),
    endDate: dateField.optional(),
  })
  .refine((r) => r.startTime < r.endTime, {
    message: 'Start time must be before end time',
    path: ['endTime'],
  });

export const dayScheduleSchema = z.object({
  ranges: z.array(timeRangeSchema),
});

/**
 * Flag the second and later items that share a key.
 *
 * The stored key is `(shelter, schedule type, day, start time, start date)`, so
 * two rows with the same key are the same row to the API and the form catches it
 * before submit. An item whose key is empty already fails its own field check
 * (a range with no time yet) — reporting it as a duplicate would be noise and
 * would interpolate an empty value into the message.
 */
const flagDuplicateKeys = <T>(
  items: T[],
  keyOf: (item: T) => string,
  ctx: z.RefinementCtx,
  issueFor: (
    item: T,
    index: number,
  ) => { message: string; path: (string | number)[] },
) => {
  const seen = new Set<string>();

  items.forEach((item, index) => {
    const key = keyOf(item);

    if (!key) {
      return;
    }

    if (!seen.has(key)) {
      seen.add(key);
      return;
    }

    ctx.addIssue({ code: z.ZodIssueCode.custom, ...issueFor(item, index) });
  });
};

export const weeklyFormStateSchema = z
  .record(z.enum(DayOfWeekChoices), dayScheduleSchema)
  .superRefine((weekly, ctx) => {
    for (const [day, schedule] of Object.entries(weekly)) {
      flagDuplicateKeys(
        schedule.ranges,
        (range) => range.startTime,
        ctx,
        (range, index) => ({
          message: `Another range already starts at ${range.startTime}`,
          path: [day, 'ranges', index, 'startTime'],
        }),
      );
    }
  });

// Exception Schedules

const exceptionBaseFields = {
  localId: z.string(),
  serverId: z.string().optional(),
  startDate: dateField,
  // Display-only: whether the form shows a separate end date field. Kept in
  // form state (rather than derived from the dates) so that entering a date
  // cannot toggle the field, and equal start/end dates stay a range.
  isDateRange: z.boolean(),
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

/** Stands in for "no start time" in the exception key: a closure is all day. */
const allDayKey = 'all-day';

/**
 * Exception rows are keyed by date and start time too, so two entries covering
 * the same date at the same starting time are the same row to the API.
 */
const exceptionListSchema = z
  .array(exceptionEntrySchema)
  .superRefine((entries, ctx) => {
    flagDuplicateKeys(
      entries,
      (entry) =>
        entry.startDate
          ? `${entry.startDate} ${entry.closedAllDay ? allDayKey : entry.startTime}`
          : '',
      ctx,
      (entry, index) => ({
        message: 'Another exception already covers this date and start time',
        // An all-day entry hides its time inputs, so the issue has to land on a
        // field that is on screen or the form blocks Save with nothing to show.
        path: [index, entry.closedAllDay ? 'startDate' : 'startTime'],
      }),
    );
  });

export const scheduleFormSchema = z.object({
  weekly: weeklyFormStateSchema,
  exceptions: exceptionListSchema,
});

export type ScheduleFormData = z.infer<typeof scheduleFormSchema>;
