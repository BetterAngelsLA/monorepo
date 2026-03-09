import { ClockIcon } from '@monorepo/react/icons';
import { format, parse } from 'date-fns';
import { useMemo } from 'react';
import { ScheduleTypeChoices, ShelterType } from '../../../apollo';
import {
  EffectiveWindow,
  getEffectiveWindows,
  getNext7Days,
} from './scheduleUtils';

type Schedule = ShelterType['schedules'][number];

const TYPE_LABELS: Record<ScheduleTypeChoices, string> = {
  [ScheduleTypeChoices.Operating]: 'Operating Hours',
  [ScheduleTypeChoices.Intake]: 'Intake Hours',
  [ScheduleTypeChoices.MealService]: 'Meal Service',
  [ScheduleTypeChoices.StaffAvailability]: 'Staff Availability',
};

function formatTime(t?: string | null): string {
  if (!t) return '--:--';
  try {
    return format(parse(t, 'HH:mm:ss', new Date()), 'h:mm a');
  } catch {
    return t;
  }
}

function formatWindowRange(w: EffectiveWindow): string {
  return `${formatTime(w.openTime)} – ${formatTime(w.closeTime)}`;
}

function WeeklyScheduleSection({
  type,
  allSchedules,
}: {
  type: ScheduleTypeChoices;
  allSchedules: Schedule[];
}) {
  const days = useMemo(() => getNext7Days(), []);
  const weekData = useMemo(
    () =>
      days.map((date) => ({
        date,
        label: format(date, 'EEE MMM d'),
        windows: getEffectiveWindows(allSchedules, date, type),
      })),
    [days, allSchedules, type]
  );

  return (
    <div className="mb-4 last:mb-0">
      <h4 className="font-medium text-sm mb-1">{TYPE_LABELS[type]}</h4>
      <div className="flex flex-col gap-1 ml-2">
        {weekData.map(({ date, label, windows }) => (
          <div key={date.toISOString()} className="flex text-sm">
            <span className="w-24 shrink-0 text-neutral-50">{label}</span>
            {windows.length > 0 ? (
              <span>{windows.map(formatWindowRange).join(', ')}</span>
            ) : (
              <span className="text-neutral-50 italic">Closed</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function OperatingHours({
  schedules,
}: {
  schedules?: ShelterType['schedules'];
}) {
  const entries = schedules || [];
  const notAvailable = !entries.length;

  // Collect unique schedule types in order of appearance
  const scheduleTypes = useMemo(() => {
    const seen = new Set<ScheduleTypeChoices>();
    const types: ScheduleTypeChoices[] = [];
    for (const entry of entries) {
      if (!seen.has(entry.scheduleType)) {
        seen.add(entry.scheduleType);
        types.push(entry.scheduleType);
      }
    }
    return types;
  }, [entries]);

  return (
    <div className="text-sm my-6">
      <div className="mb-2 flex items-center gap-2">
        <ClockIcon className="w-6 h-6 fill-primary-20" />
        <h3 className="font-semibold">Operating Hours</h3>
      </div>
      {notAvailable ? (
        <p>Not Available. Contact the institution.</p>
      ) : (
        <div className="flex flex-col mx-8">
          {scheduleTypes.map((type) => (
            <WeeklyScheduleSection
              key={type}
              type={type}
              allSchedules={entries}
            />
          ))}
        </div>
      )}
    </div>
  );
}
