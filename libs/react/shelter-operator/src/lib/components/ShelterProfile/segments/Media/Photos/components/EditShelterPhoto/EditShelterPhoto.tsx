import { BaError, getFieldErrorsOrThrow } from '@monorepo/ba-platform';
import { applyFieldErrors } from '@monorepo/react/shared';
import { useState } from 'react';
import type { UseFormSetError } from 'react-hook-form';
import { ShelterPhotoTypeChoices } from '@monorepo/ba-platform/types';
import { useUpdateShelterPhoto } from '../../../../../../../hooks/useUpdateShelterPhoto';
import { updateShelterPhotoMeta } from '../../../../../../../hooks/useUpdateShelterPhoto/__generated__/useUpdateShelterPhoto_meta.generated';
import { Modal, ModalBody, ModalHeader } from '../../../../../../base-ui/modal';
import { useToast } from '../../../../../../base-ui/toast';
import {
  formFieldNames,
  ShelterPhotoForm,
  type ShelterPhotoFormData,
} from '../../ShelterPhotoForm';
import { EditShelterPhotoBtn } from './EditShelterPhotoBtn';

type TProps = {
  photoId: string;
  photoType: ShelterPhotoTypeChoices;
  shelterId: string;
  disabled?: boolean;
};

export function EditShelterPhoto(props: TProps) {
  const { photoId, photoType, shelterId, disabled } = props;

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

  function handleClose() {
    setIsOpen(false);
  }

  return (
    <>
      <EditShelterPhotoBtn
        onClick={() => setIsOpen(true)}
        disabled={disabled || loading}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        size="sm"
        className="min-w-112"
      >
        <ModalHeader onClose={handleClose}>
          <div className="font-medium text-xl">Edit Photo</div>
        </ModalHeader>
        <ModalBody>
          <ShelterPhotoForm
            defaultValues={{ photoType }}
            onSubmit={onSubmit}
            onCancel={handleClose}
            disabled={loading}
          />
        </ModalBody>
      </Modal>
    </>
  );
}
