import { AuditTargetType } from '@monorepo/ba-platform/types';
import { useParams } from 'react-router-dom';
import { ActivityPageLayout } from '../../components/activity-page-layout';
import { ObjectAuditLog } from '../../components/audit';
import { shelterMgmtResourceRoute } from '../../routing';

export function BedActivityPage() {
  const { shelterId, id: bedId } = useParams<{
    shelterId: string;
    id: string;
  }>();

  if (!shelterId || !bedId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return (
    <ActivityPageLayout
      backLinkPath={shelterMgmtResourceRoute(shelterId, 'bed')}
      backLinkLabel="Back to Beds"
      title="Bed activity"
    >
      <ObjectAuditLog targetType={AuditTargetType.Bed} objectId={bedId} />
    </ActivityPageLayout>
  );
}
