import { BaError, getFieldErrorsOrThrow } from '@monorepo/ba-platform';
import { applyFieldErrors, mergeCss } from '@monorepo/react/shared';
import { Pencil } from 'lucide-react';
import { useState } from 'react';
import type { UseFormSetError } from 'react-hook-form';
import { ShelterPhotoTypeChoices } from '../../../../../../../apollo/graphql/__generated__/types';
import { useUpdateShelterPhoto } from '../../../../../../../hooks/useUpdateShelterPhoto';
import { updateShelterPhotoMeta } from '../../../../../../../hooks/useUpdateShelterPhoto/__generated__/useUpdateShelterPhoto_meta.generated';
import { Modal, ModalBody, ModalHeader } from '../../../../../../base-ui/modal';
import { useToast } from '../../../../../../base-ui/toast';
import {
  formFieldNames,
  ShelterPhotoForm,
  type ShelterPhotoFormData,
} from '../../ShelterPhotoForm';

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

  async function onSubmit(
    data: ShelterPhotoFormData,
    setError: UseFormSetError<ShelterPhotoFormData>
  ) {
    try {
      const response = await updateShelterPhoto({
        variables: {
          data: { id: photoId, photoType: data.photoType },
        },
      });

      const fieldErrors = getFieldErrorsOrThrow({
        response,
        ...updateShelterPhotoMeta,
        fields: formFieldNames,
      });

      if (fieldErrors.length) {
        applyFieldErrors(fieldErrors, setError);

        throw new BaError('Please see validation messages.');
      }

      setIsOpen(false);
      showToast({ status: 'success', title: 'Photo updated.' });
    } catch (e) {
      if (e instanceof BaError) {
        return;
      }

      console.error(`[updateShelterPhoto error]: ${e}.`);

      showToast({
        status: 'error',
        title: 'Update failed',
        description: 'An unexpected error occurred.',
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
