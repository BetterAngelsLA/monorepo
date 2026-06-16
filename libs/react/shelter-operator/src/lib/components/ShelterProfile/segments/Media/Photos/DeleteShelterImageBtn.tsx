import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ConfirmationModal } from '../../../../base-ui/modal/ConfirmationModal';
import { useDeleteShelterPhoto } from '../../../../../hooks/useDeleteShelterPhoto';

type TProps = {
  photoId: string;
  shelterId: string;
};

export function DeleteShelterImageBtn(props: TProps) {
  const { photoId, shelterId } = props;
  const [isOpen, setIsOpen] = useState(false);
  const { deleteShelterPhoto, loading } = useDeleteShelterPhoto(shelterId);

  async function handleConfirm() {
    await deleteShelterPhoto({ variables: { data: { ids: [photoId] } } });
    setIsOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-red-600 hover:text-red-800"
        aria-label="Delete photo"
      >
        <Trash2 size={18} />
      </button>

      <ConfirmationModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Delete photo?"
        description="This photo will be permanently removed."
        variant="danger"
        primaryAction={{
          label: 'Delete',
          onClick: handleConfirm,
          isLoading: loading,
        }}
        secondaryAction={{ label: 'Cancel', onClick: () => setIsOpen(false) }}
      />
    </>
  );
}
