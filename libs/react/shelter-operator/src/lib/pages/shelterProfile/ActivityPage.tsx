import { AuditTargetType } from '@monorepo/ba-platform/types';
import { useParams } from 'react-router-dom';
import { ObjectAuditLog } from '../../components/audit';

export function ShelterActivityPage() {
  const { shelterId } = useParams<{ shelterId: string }>();

  if (!shelterId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return (
    <ObjectAuditLog
      targetType={AuditTargetType.Shelter}
      objectId={shelterId}
    />
  );
}
