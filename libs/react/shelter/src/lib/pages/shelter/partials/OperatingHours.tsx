import { Card } from '@monorepo/react/components';
import { ChevronUpIcon } from '@monorepo/react/icons';
import { useAtom } from 'jotai';
import { useMemo, useState } from 'react';
import { ScheduleTypeChoices, ShelterType } from '../../../apollo';
import { ModalAnimationEnum, modalAtom } from '../../../components/Modal';
import {
  EffectiveWindow,
  getOperatingStatus,
  getWeeklySchedule,
  OperatingStatus,
} from './scheduleUtils';

type Schedule = ShelterType['schedules'][number];

const TYPE_LABELS: Record<ScheduleTypeChoices, string> = {
  [ScheduleTypeChoices.Operating]: 'Operating Hours',
  [ScheduleTypeChoices.Intake]: 'Intake Hours',
  [ScheduleTypeChoices.MealService]: 'Meal Service',
  [ScheduleTypeChoices.StaffAvailability]: 'Staff Availability',
};

function formatWindowRange(window: EffectiveWindow): string {
  const start = new Date(`1970-01-01T${window.startTime}`);
  const end = new Date(`1970-01-01T${window.endTime}`);

  const startText = start.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
  const endText = end.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  return `${startText} - ${endText}`;
}

function statusToneClass(tone: OperatingStatus['tone']): string {
  return tone === 'open' ? 'text-[#15803d]' : 'text-[#b91c1c]';
}

function statusSurfaceClass(tone: OperatingStatus['tone']): string {
  return tone === 'open'
    ? 'bg-[#f0fdf4] border-[#bbf7d0]'
    : 'bg-[#fef2f2] border-[#fecaca]';
}

function StatusLine({
  status,
  className = '',
  emphasized = false,
}: {
  status: OperatingStatus;
  className?: string;
  emphasized?: boolean;
}) {
  return (
    <p
      className={`${
        emphasized ? 'rounded-full border px-3 py-1.5' : ''
      } text-sm ${statusToneClass(status.tone)} ${
        emphasized ? statusSurfaceClass(status.tone) : ''
      } ${className}`.trim()}
    >
      <span className="font-semibold">{status.statusText}</span>
      {status.detailText ? (
        <span className="font-normal"> {status.detailText}</span>
      ) : null}
    </p>
  );
}

function OperatingHoursDialog({
  schedules,
  status,
  scheduleTypes,
}: {
  schedules: Schedule[];
  status: OperatingStatus;
  scheduleTypes: ScheduleTypeChoices[];
}) {
  const [selectedType, setSelectedType] = useState<ScheduleTypeChoices>(
    scheduleTypes[0] ?? ScheduleTypeChoices.Operating
  );

  const selectedWeek = useMemo(
    () => getWeeklySchedule(schedules, selectedType),
    [schedules, selectedType]
  );

  return (
    <div className="w-full">
      <div className="mb-6 border-b border-neutral-90 pb-4">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-neutral-20">
            Operating Hours
          </h3>
        </div>
        <StatusLine status={status} emphasized />
      </div>

      {scheduleTypes.length > 1 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {scheduleTypes.map((scheduleType) => {
            const isSelected = scheduleType === selectedType;
            return (
              <button
                key={scheduleType}
                type="button"
                onClick={() => setSelectedType(scheduleType)}
                className={
                  isSelected
                    ? 'rounded-full border border-primary-60 bg-primary-60 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.04em] text-white transition-colors'
                    : 'rounded-full border border-neutral-90 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.04em] text-neutral-40 transition-colors hover:border-primary-60 hover:text-primary-60'
                }
              >
                {TYPE_LABELS[scheduleType]}
              </button>
            );
          })}
        </div>
      ) : null}

      <section className="flex h-[420px] flex-col rounded-xl border border-neutral-90 bg-neutral-99/40 px-4 py-4">
        <div className="flex flex-1 flex-col divide-y divide-neutral-90/80 overflow-y-auto pr-1">
          {selectedWeek.map((day) => (
            <div
              key={`${selectedType}-${day.date.toISOString()}`}
              className={
                day.isToday ? 'rounded-lg bg-primary-95 px-3 py-3' : 'px-1 py-3'
              }
            >
              <div className="flex items-start gap-4 text-sm">
                <div
                  className={
                    day.isToday
                      ? 'w-32 shrink-0 font-semibold text-primary-60'
                      : 'w-32 shrink-0 font-medium text-neutral-40'
                  }
                >
                  {day.label}
                  {day.isToday ? (
                    <span className="ml-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-primary-60">
                      Today
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  {day.windows.length > 0 ? (
                    day.windows.map((window, index) => (
                      <div
                        key={`${day.date.toISOString()}-${window.startTime}-${
                          window.endTime
                        }-${index}`}
                        className={
                          day.isToday
                            ? 'font-semibold text-neutral-20'
                            : 'text-neutral-20'
                        }
                      >
                        {formatWindowRange(window)}
                      </div>
                    ))
                  ) : (
                    <div className="font-medium text-[#b91c1c]">Closed</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function OperatingHours({
  schedules,
}: {
  schedules?: ShelterType['schedules'];
}) {
  const entries = schedules ?? [];
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

  const operatingSchedules = useMemo(
    () =>
      entries.filter(
        (entry) => entry.scheduleType === ScheduleTypeChoices.Operating
      ),
    [entries]
  );
  const status = useMemo(
    () => getOperatingStatus(operatingSchedules),
    [operatingSchedules]
  );

  const [_modal, setModal] = useAtom(modalAtom);

  function openHoursDialog() {
    setModal({
      content: (
        <OperatingHoursDialog
          schedules={entries}
          status={status}
          scheduleTypes={scheduleTypes}
        />
      ),
      animation: ModalAnimationEnum.SLIDE_UP,
      fullW: true,
    });
  }

  return (
    <div className="my-6">
      <Card title="Operating Hours">
        <div className="flex items-center justify-between gap-4">
          <StatusLine status={status} emphasized />

          <button
            type="button"
            onClick={openHoursDialog}
            aria-haspopup="dialog"
            className="flex items-center gap-2 rounded-full bg-primary-95 px-3 py-1.5 text-sm font-medium text-primary-60 transition-colors hover:bg-primary-90"
          >
            <span>More Hours</span>
            <ChevronUpIcon className="h-3 w-3 rotate-180" />
          </button>
        </div>
      </Card>
    </div>
  );
}
