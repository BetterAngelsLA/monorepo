import { AuditTargetType } from '@monorepo/ba-platform/types';
import { useParams } from 'react-router-dom';
import { ActivityPageLayout } from '../../components/activity-page-layout';
import { ObjectAuditLog } from '../../components/audit';
import { shelterMgmtResourceRoute } from '../../routing';

export function RoomActivityPage() {
  const { shelterId, id: roomId } = useParams<{
    shelterId: string;
    id: string;
  }>();

  if (!shelterId || !roomId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return (
    <ActivityPageLayout
      backLinkPath={shelterMgmtResourceRoute(shelterId, 'room')}
      backLinkLabel="Back to Rooms"
      title="Room activity"
    >
      <ObjectAuditLog targetType={AuditTargetType.Room} objectId={roomId} />
    </ActivityPageLayout>
  );
}
