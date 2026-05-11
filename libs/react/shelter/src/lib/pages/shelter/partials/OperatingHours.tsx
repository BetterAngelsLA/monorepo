import { useAtom } from 'jotai';
import { useEffect, useMemo, useState } from 'react';
import { ScheduleTypeChoices, ShelterType } from '../../../apollo';
import { ModalAnimationEnum, modalAtom } from '../../../components/Modal';
import {
  AggregateStatus,
  EffectiveWindow,
  getAggregateStatus,
  getOperatingStatus,
  getWeeklySchedule,
  OperatingStatus,
} from './scheduleUtils';

type Schedule = ShelterType['schedules'][number];

const ClockIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="10" cy="10" r="9" stroke="#6B7280" strokeWidth="2" />
    <path
      d="M10 5v5l3 2"
      stroke="#6B7280"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const TYPE_LABELS: Record<ScheduleTypeChoices, string> = {
  [ScheduleTypeChoices.Operating]: 'Operating Hours',
  [ScheduleTypeChoices.Intake]: 'Intake Hours',
  [ScheduleTypeChoices.MealService]: 'Meal Service',
  [ScheduleTypeChoices.StaffAvailability]: 'Staff Availability',
};

function getInitialScheduleType(
  scheduleTypes: ScheduleTypeChoices[]
): ScheduleTypeChoices {
  if (scheduleTypes.includes(ScheduleTypeChoices.Operating)) {
    return ScheduleTypeChoices.Operating;
  }

  return scheduleTypes[0] ?? ScheduleTypeChoices.Operating;
}

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

function StatusLine({ status }: { status: OperatingStatus }) {
  // Designer colors
  const toneColor = status.tone === 'open' ? '#23CE6B' : '#CB0808';
  const toneFontWeight = status.tone === 'open' ? 'font-bold' : 'font-semibold';
  return (
    <div
      className="flex flex-row items-center gap-2"
      style={{
        fontFamily: 'Poppins, sans-serif',
        fontSize: 14,
        lineHeight: '21px',
        height: 21,
      }}
    >
      <span className={toneFontWeight} style={{ color: toneColor }}>
        {status.statusText}
      </span>
    </div>
  );
}

function AggregateStatusText({ status }: { status: AggregateStatus }) {
  const colorMap = {
    open: '#23CE6B',
    closed: '#CB0808',
    partial: '#D4A017',
  };
  return (
    <span
      className="font-bold text-sm"
      style={{ color: colorMap[status.tone] }}
    >
      {status.statusText}
    </span>
  );
}

function OperatingHoursDialog({
  schedules,
  scheduleTypes,
}: {
  schedules: Schedule[];
  scheduleTypes: ScheduleTypeChoices[];
}) {
  const [selectedType, setSelectedType] = useState<ScheduleTypeChoices>(
    getInitialScheduleType(scheduleTypes)
  );

  const selectedWeek = useMemo(
    () => getWeeklySchedule(schedules, selectedType),
    [schedules, selectedType]
  );

  const selectedStatus = useMemo(() => {
    const typed = schedules.filter((s) => s.scheduleType === selectedType);
    return getOperatingStatus(typed, new Date(), selectedType);
  }, [schedules, selectedType]);

  return (
    <div className="w-full">
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

      <div className="mb-4">
        <StatusLine status={selectedStatus} />
      </div>

      <section className="flex h-[420px] flex-col rounded-xl px-0 py-3">
        <div className="flex flex-1 flex-col overflow-y-auto pr-0.5">
          {selectedWeek.map((day, index) => {
            const last = index === selectedWeek.length - 1;
            const first = index === 0;

            return (
              <div
                key={`${selectedType}-${day.date.toISOString()}`}
                className={[
                  'overflow-hidden border-b border-l border-r border-neutral-90/80',
                  last && 'rounded-bl-lg rounded-br-lg',
                  first && 'rounded-tl-lg rounded-tr-lg border-t',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <div
                  className={
                    day.isToday ? 'bg-primary-95 px-3 py-3' : 'px-3 py-3'
                  }
                >
                  <div className="grid grid-cols-[9rem_minmax(0,1fr)] items-start gap-4 text-sm">
                    <div
                      className={
                        day.isToday
                          ? 'min-w-0 text-primary-60'
                          : 'min-w-0 text-neutral-40'
                      }
                    >
                      {day.isToday ? (
                        <div className="grid grid-cols-[max-content_minmax(0,1fr)] items-center">
                          <span className="font-semibold">{day.label}</span>
                          <div className="flex justify-center">
                            <span className="inline-flex shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-primary-60">
                              Today
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="font-medium">{day.label}</span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-1">
                      {day.windows.length > 0 ? (
                        day.windows.map((window, index) => (
                          <div
                            key={`${day.date.toISOString()}-${
                              window.startTime
                            }-${window.endTime}-${index}`}
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
              </div>
            );
          })}
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
  const entries = useMemo(() => schedules ?? [], [schedules]);
  const scheduleTypes = useMemo(() => {
    const seen = new Set<ScheduleTypeChoices>();
    const types: ScheduleTypeChoices[] = [];
    for (const entry of entries) {
      if (!seen.has(entry.scheduleType)) {
        seen.add(entry.scheduleType);
        types.push(entry.scheduleType);
      }
    }

    if (!types.includes(ScheduleTypeChoices.Operating)) {
      return types;
    }

    return [
      ScheduleTypeChoices.Operating,
      ...types.filter(
        (scheduleType) => scheduleType !== ScheduleTypeChoices.Operating
      ),
    ];
  }, [entries]);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const aggregateStatus = useMemo(
    () => getAggregateStatus(entries, scheduleTypes, now),
    [entries, scheduleTypes, now]
  );

  const [_modal, setModal] = useAtom(modalAtom);

  function openHoursDialog() {
    setModal({
      content: (
        <OperatingHoursDialog
          schedules={entries}
          scheduleTypes={scheduleTypes}
        />
      ),
      animation: ModalAnimationEnum.SLIDE_UP,
      fullW: true,
      className: 'mx-4 w-[calc(100%-2rem)] max-w-[calc(100%-2rem)]',
    });
  }

  return (
    <section className="my-6 w-full">
      <div className="flex items-center gap-2 w-full">
        <ClockIcon />
        <AggregateStatusText status={aggregateStatus} />
        <button
          type="button"
          onClick={openHoursDialog}
          aria-haspopup="dialog"
          className="flex flex-row items-center gap-2 px-2 py-1 bg-[#F4F6FD] rounded text-[12px] font-normal leading-[21px] text-[#052B73] transition-colors hover:bg-blue-100 ml-auto"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          More Hours
          <svg
            className="w-4 h-4"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 6l4 4 4-4"
              stroke="#052B73"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </section>
  );
}
