import { ClockIcon } from '@monorepo/react/icons';
import { ShelterType } from '../../apollo';

export default function OperationHours({
  operatingHours,
}: {
  operatingHours?: ShelterType['operatingHours'];
}) {
  const notAvailable = !operatingHours?.length;
  const formatTime = (t: string) => t.slice(0, 5);

  return (
    <div className="text-sm my-6">
      <div className="mb-2 flex items-center gap-2">
        <ClockIcon className="w-6 h-6 fill-primary-20" />
        <h3 className="font-semibold">Operation Hours</h3>
      </div>
      {notAvailable ? (
        <p>Not Available. Contact the institution.</p>
      ) : (
        <div className="flex flex-col mx-8 gap-2">
          {operatingHours.map((hour, index) => (
            <p className="text-sm" key={index}>
              {formatTime(hour?.start)} - {formatTime(hour?.end)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
