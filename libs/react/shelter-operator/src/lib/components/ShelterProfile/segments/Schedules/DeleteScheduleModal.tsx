import { ScheduleTypeChoices } from '@monorepo/react/shelter';
import { ConfirmationModal } from '../../../base-ui/modal/ConfirmationModal';
import { SCHEDULE_TAB_LABELS } from './constants';

type TProps = {
  scheduleType: ScheduleTypeChoices;
  onConfirm: () => void;
  onClose: () => void;
};

export function DeleteScheduleModal(props: TProps) {
  const { scheduleType, onConfirm, onClose } = props;

  return (
    <ConfirmationModal
      isOpen
      onClose={onClose}
      title="Delete schedule?"
      description={`All ${SCHEDULE_TAB_LABELS[scheduleType]} entries will be permanently removed.`}
      variant="danger"
      primaryAction={{ label: 'Delete', onClick: onConfirm }}
      secondaryAction={{ label: 'Cancel', onClick: onClose }}
    />
  );
}
