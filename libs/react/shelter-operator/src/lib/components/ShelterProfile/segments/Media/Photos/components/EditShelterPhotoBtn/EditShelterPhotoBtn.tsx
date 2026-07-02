import { mergeCss } from '@monorepo/react/shared';
import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { ShelterPhotoTypeChoices } from '@monorepo/ba-platform/types';
import { useUpdateShelterPhoto } from '../../../../../../../hooks/useUpdateShelterPhoto';
import { Modal, ModalBody, ModalHeader } from '../../../../../../base-ui/modal';
import { useToast } from '../../../../../../base-ui/toast';
import { ShelterPhotoForm } from '../../ShelterPhotoForm/ShelterPhotoForm';
import type { ShelterPhotoFormData } from '../../ShelterPhotoForm/formSchema';

type TProps = {
  photoId: string;
  photoType: ShelterPhotoTypeChoices;
  shelterId: string;
  className?: string;
  disabled?: boolean;
};

export function EditShelterPhotoBtn(props: TProps) {
  const { photoId, photoType, shelterId, className, disabled } = props;

  const [isOpen, setIsOpen] = useState(false);
  const { showToast } = useToast();
  const { updateShelterPhoto, loading } = useUpdateShelterPhoto({ shelterId });

  async function onSubmit(data: ShelterPhotoFormData) {
    try {
      const response = await updateShelterPhoto({
        variables: {
          data: { id: photoId, photoType: data.photoType },
        },
      });

      const result = response.data?.updateShelterPhoto;

      if (result?.__typename === 'ShelterPhotoType') {
        setIsOpen(false);
        showToast({ status: 'success', title: 'Photo updated.' });
        return;
      }

      throw new Error('unexpected mutation response');
    } catch {
      showToast({
        status: 'error',
        title: 'Update failed',
        description: 'An unexpected error occurred.',
        persistent: true,
      });
    }
  }

  const btnCss = [
    'text-gray-500',
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
        aria-label="Edit photo type"
      >
        <Pencil size={16} />
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        size="sm"
        className="min-w-112"
      >
        <ModalHeader onClose={() => setIsOpen(false)}>
          <div className="font-medium text-xl">Edit Photo</div>
        </ModalHeader>

        <ModalBody>
          <ShelterPhotoForm
            defaultValues={{ photoType }}
            onSubmit={onSubmit}
            onCancel={() => setIsOpen(false)}
            disabled={loading}
          />
        </ModalBody>
      </Modal>
    </>
  );
}
