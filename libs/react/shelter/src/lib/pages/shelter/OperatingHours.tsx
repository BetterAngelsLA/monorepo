import { ClockIcon } from '@monorepo/react/icons';

export default function OperatingHours() {
  const notAvailable = true;
  return (
    <div className="text-sm my-6">
      <div className="mb-1 flex items-center gap-2">
        <ClockIcon className="w-6 h-6 fill-primary-20" />
        <h3 className="font-semibold">Operating Hours</h3>
      </div>
      {notAvailable ? (
        <p>Not Available. Contact the institution.</p>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <span className="text-success-30 font-semibold">Open</span>
            <p>
              <span className="font-semibold">For Men</span> - M-F: 6:30 AM. to
              9:00 PM (Closed from 11:00 to 11:30 a.m. and 5:00 to 5:30 p.m.)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-success-30 font-semibold">Open</span>
            <p>
              <span className="font-semibold">For Women</span> - M-F: 6:30 AM.
              to 8:00 PM
            </p>
          </div>
        </>
      )}
    </div>
  );
}
