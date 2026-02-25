import { TaskForm } from '../../../../ui-components';
import { DraftTask } from '../formSchema';

type HmisTaskModalProps = {
  task?: DraftTask;
  closeModal: () => void;
  onSubmit: (data: DraftTask) => void;
  onDelete?: () => void;
};

export default function HmisTaskModal(props: HmisTaskModalProps) {
  const { task, closeModal, onSubmit, onDelete } = props;

  const showDelete = !!onDelete || !!task?.id;

  const handleSave = (data: DraftTask) => {
    if (task?.id) {
      data.id = task.id;
    } else {
      data.id = 'tmp-' + Math.random().toString(36);
    }
    onSubmit(data);
    closeModal();
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      closeModal();
    }
  };

  return (
    <TaskForm
      initialValues={task}
      onSubmit={handleSave}
      onCancel={closeModal}
      onDelete={showDelete ? handleDelete : undefined}
    />
  );
}
