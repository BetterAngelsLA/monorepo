import { mergeCss } from '@monorepo/react/shared';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useDeleteShelterPhotos } from '../../../../../../hooks/useDeleteShelterPhotos';
import { ConfirmationModal } from '../../../../../base-ui/modal/ConfirmationModal';
import { useToast } from '../../../../../base-ui/toast';

type TProps = {
  photoId: string;
  shelterId: string;
  className?: string;
  disabled?: boolean;
};

export function DeleteShelterImageBtn(props: TProps) {
  const { photoId, shelterId, className, disabled } = props;

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

  const btnCss = [
    'text-red-500',
    'opacity-70 hover:opacity-100',
    'p-2 rounded-full hover:bg-white',
    'hover:shadow-xl',
    'cursor-pointer',
    className,
  ];

  return (
    <>
      <button
        disabled={disabled || loading}
        type="button"
        onClick={() => setIsOpen(true)}
        className={mergeCss(btnCss)}
        aria-label="Delete photo"
      >
        <Trash2 size={16} />
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
