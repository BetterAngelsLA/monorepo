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

/**
 * A range may cross midnight: a shelter open 8:30 PM – 7:30 AM starts on one day
 * and ends on the next.
 *
 * Equal times are rejected rather than read as 24 hours. The model has no
 * ordering rule — `duration_minutes` is a modulo-1440 duration — but the UI has
 * no way to show a 24-hour day, so the row would come back looking like
 * `09:00 - 09:00` with the shelter open all day. A same-time typo is worth a
 * clear error; real 24-hour support needs its own display work.
 *
 * Empty times are not "equal": each field already fails its own format check,
 * and telling someone who has typed nothing that the two times match is wrong.
 */
const timesDiffer = (r: { startTime: string; endTime: string }) =>
  r.startTime === '' || r.endTime === '' || r.startTime !== r.endTime;

const equalTimesMessage = "Start and end time can't be the same";

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
  .refine(timesDiffer, {
    message: equalTimesMessage,
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
    // An exception's hours can cross midnight too, exactly like a weekly
    // range, so its times are format-checked only.
    z.object({
      ...exceptionBaseFields,
      closedAllDay: z.literal(false),
      startTime: timeField,
      endTime: timeField,
    }),
  ])
  // Only an open exception carries times; a closure is all day by definition.
  .refine((e) => e.closedAllDay || timesDiffer(e), {
    message: equalTimesMessage,
    path: ['endTime'],
  })
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
