import { ClockIcon } from '@monorepo/react/icons';

const DAYS_OF_WEEK = [
  { value: 'MONDAY', label: 'Monday' },
  { value: 'TUESDAY', label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY', label: 'Thursday' },
  { value: 'FRIDAY', label: 'Friday' },
  { value: 'SATURDAY', label: 'Saturday' },
  { value: 'SUNDAY', label: 'Sunday' },
];

export default function OperationHours({
  operatingHours,
}: {
  operatingHours?: {
    dayOfWeek?: string | null;
    opensAt?: string | null;
    closesAt?: string | null;
  }[];
}) {
  const groupedByDay = (operatingHours || []).reduce<Record<string, any[]>>(
    (acc, hour) => {
      if (!hour?.dayOfWeek) return acc;
      if (!acc[hour.dayOfWeek]) acc[hour.dayOfWeek] = [];
      acc[hour.dayOfWeek].push(hour);
      return acc;
    },
    {}
  );
  const notAvailable = !operatingHours?.length;
  const formatTime = (t?: string | null) => (t ? t.slice(0, 5) : '--:--');

  return (
    <div className="text-sm my-6">
      <div className="mb-2 flex items-center gap-2">
        <ClockIcon className="w-6 h-6 fill-primary-20" />
        <h3 className="font-semibold">Operation Hours</h3>
      </div>
      {notAvailable ? (
        <p>Not Available. Contact the shelter.</p>
      ) : (
        <div className="flex flex-col mx-8 gap-4">
          {DAYS_OF_WEEK.filter((day) => groupedByDay[day.value]).map((day) => (
            <div key={day.value}>
              <div className="font-medium">{day.label}</div>
              <div className="flex flex-col ml-2 gap-1">
                {groupedByDay[day.value].map((hour, idx) => (
                  <span key={idx}>
                    {formatTime(hour.opensAt)} - {formatTime(hour.closesAt)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
