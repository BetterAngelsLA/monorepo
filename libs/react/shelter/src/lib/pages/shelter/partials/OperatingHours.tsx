import { ClockIcon } from '@monorepo/react/icons';
import { format, parse } from 'date-fns';
import { ShelterType } from '../../../apollo';

export function OperatingHours({
  operatingHours,
}: {
  operatingHours?: ShelterType['operatingHours'];
}) {
  const filteredHours = (operatingHours || []).filter(
    (hour) => hour?.start || hour?.end
  );

  const notAvailable = !operatingHours?.length;
  const formatTime = (t?: string | null) =>
    t ? format(parse(t, 'HH:mm:ss', new Date()), 'h:mm a') : '--:--';

  return (
    <div className="text-sm my-6">
      <div className="mb-2 flex items-center gap-2">
        <ClockIcon className="w-6 h-6 fill-primary-20" />
        <h3 className="font-semibold">Operating Hours</h3>
      </div>
      {notAvailable ? (
        <p>Not Available. Contact the institution.</p>
      ) : (
        <div className="flex flex-col mx-8 gap-2">
          {filteredHours.map((hour, index) => (
            <p className="text-sm" key={index}>
              {formatTime(hour?.start)} - {formatTime(hour?.end)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
