import { useState } from 'react';
import { useDeleteShelterPhotos } from '../../../../../../../hooks/useDeleteShelterPhotos';
import { ConfirmationModal } from '../../../../../../base-ui/modal/ConfirmationModal';
import { TableActionBtn } from '../../../../../../base-ui/table';
import { useToast } from '../../../../../../base-ui/toast';

type TProps = {
  photoId: string;
  shelterId: string;
  disabled?: boolean;
};

export function DeleteShelterImage(props: TProps) {
  const { photoId, shelterId, disabled } = props;

  const [isOpen, setIsOpen] = useState(false);
  const { deleteShelterPhotos, loading } = useDeleteShelterPhotos({
    shelterId,
  });
  const { showToast } = useToast();

  async function handleConfirm() {
    try {
      await deleteShelterPhotos({ variables: { data: { ids: [photoId] } } });

      showToast({
        status: 'success',
        title: 'Photo deleted.',
      });
    } catch (e) {
      console.error(`[deleteShelterPhotos error]: ${e}.`);

      showToast({
        status: 'error',
        title: 'Delete failed',
        description: 'Sorry, an unexpected error occurred.',
      });
    } finally {
      setIsOpen(false);
    }
  }

  function handleClose() {
    setIsOpen(false);
  }

  return (
    <>
      <TableActionBtn
        action="delete"
        label="Delete photo"
        onClick={() => setIsOpen(true)}
        disabled={disabled || loading}
      />

      <ConfirmationModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Delete photo?"
        description="This photo will be permanently removed."
        variant="danger"
        primaryAction={{
          label: 'Delete',
          onClick: handleConfirm,
          isLoading: loading,
        }}
        secondaryAction={{ label: 'Cancel', onClick: handleClose }}
      />
    </>
  );
}
