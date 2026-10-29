import { AuditTargetType } from '@monorepo/ba-platform/types';
import { Link, useParams } from 'react-router-dom';
import { ObjectAuditLog } from '../../components/audit';
import { profileRouteConfig, shelterProfileRoute } from '../../routing';

export function ShelterActivityPage() {
  const { shelterId } = useParams<{ shelterId: string }>();

  if (!shelterId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return (
    <div className="flex flex-col gap-6 px-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2 pl-5">
        {/* The profile segments use `Form.Header`; this page is not a form, so a
            heading plus a way back keeps the same visual structure. */}
        <h1 className="text-[1.75rem] font-medium text-neutral-20">Activity</h1>

        <Link
          to={shelterProfileRoute(shelterId, profileRouteConfig.children.basic)}
          className="text-sm font-medium text-blue-600 underline hover:text-blue-800"
        >
          Back to Basic Info
        </Link>
      </div>

      <ObjectAuditLog
        targetType={AuditTargetType.Shelter}
        objectId={shelterId}
      />
    </div>
  );
}
