import {
  BaError,
  BaPermissionError,
  getFieldErrorsOrThrow,
} from '@monorepo/ba-platform';
import { applyFieldErrors } from '@monorepo/react/shared';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import type { UseFormSetError } from 'react-hook-form';
import {
  createMediaLinkMeta,
  updateMediaLinkMeta,
  useCreateMediaLink,
  useDeleteMediaLinks,
  useShelterPermissions,
  useUpdateMediaLink,
} from '../../../../../hooks';
import {
  ConfirmationModal,
  Modal,
  ModalBody,
  ModalHeader,
} from '../../../../base-ui/modal';
import { useToast } from '../../../../base-ui/toast';
import { Form } from '../../../../form/Form';
import type { ShelterProfileMediaLinkType } from '../../../types';
import { MediaLinksTable } from './components/MediaLinksTable';
import {
  defaultFormValues,
  formFieldNames,
  ShelterMediaLinkForm,
  type MediaLinkFormData,
} from './ShelterMediaLinkForm';

type TProps = {
  shelterId: string;
  mediaLinks: ShelterProfileMediaLinkType[];
};

type TFormTarget =
  | { mode: 'create' }
  | { mode: 'edit'; mediaLink: ShelterProfileMediaLinkType };

function toFormValues(
  mediaLink: ShelterProfileMediaLinkType,
): MediaLinkFormData {
  return {
    mediaType: mediaLink.mediaType,
    url: mediaLink.url,
    title: mediaLink.title,
  };
}

export function ShelterMediaLinks(props: TProps) {
  const { shelterId, mediaLinks = [] } = props;

  const [formTarget, setFormTarget] = useState<TFormTarget | null>(null);
  const [pendingDelete, setPendingDelete] =
    useState<ShelterProfileMediaLinkType | null>(null);

  const { canEditShelter } = useShelterPermissions();
  const { showToast } = useToast();

  const { createMediaLink, loading: creating } = useCreateMediaLink({
    shelterId,
  });
  const { updateMediaLink, loading: updating } = useUpdateMediaLink({
    shelterId,
  });
  const { deleteMediaLinks, loading: deleting } = useDeleteMediaLinks({
    shelterId,
  });

  const isSaving = creating || updating;

  async function handleCreate(
    data: MediaLinkFormData,
    setError: UseFormSetError<MediaLinkFormData>,
  ) {
    try {
      const response = await createMediaLink({
        variables: {
          data: {
            shelterId,
            mediaType: data.mediaType,
            url: data.url,
            title: data.title || null,
          },
        },
      });

      const fieldErrors = getFieldErrorsOrThrow({
        response,
        ...createMediaLinkMeta,
        fields: formFieldNames,
      });

      if (fieldErrors.length) {
        applyFieldErrors(fieldErrors, setError);

        throw new BaError('Please see validation messages.');
      }

      setFormTarget(null);
      showToast({ status: 'success', title: 'Media link added.' });
    } catch (e) {
      handleSaveError(e, 'createMediaLink');
    }
  }

  async function handleUpdate(
    data: MediaLinkFormData,
    setError: UseFormSetError<MediaLinkFormData>,
  ) {
    if (formTarget?.mode !== 'edit') {
      return;
    }

    try {
      const response = await updateMediaLink({
        variables: {
          data: {
            id: formTarget.mediaLink.id,
            mediaType: data.mediaType,
            url: data.url,
            title: data.title || null,
          },
        },
      });

      const fieldErrors = getFieldErrorsOrThrow({
        response,
        ...updateMediaLinkMeta,
        fields: formFieldNames,
      });

      if (fieldErrors.length) {
        applyFieldErrors(fieldErrors, setError);

        throw new BaError('Please see validation messages.');
      }

      setFormTarget(null);
      showToast({ status: 'success', title: 'Media link updated.' });
    } catch (e) {
      handleSaveError(e, 'updateMediaLink');
    }
  }

  async function handleDelete() {
    if (!pendingDelete) {
      return;
    }

    try {
      await deleteMediaLinks({
        variables: { data: { ids: [pendingDelete.id] } },
      });

      showToast({ status: 'success', title: 'Media link deleted.' });
    } catch (e) {
      console.error(`[deleteMediaLinks error]: ${e}.`);

      showToast({
        status: 'error',
        title: 'Delete failed',
        description: 'Sorry, an unexpected error occurred.',
      });
    } finally {
      setPendingDelete(null);
    }
  }

  function handleSaveError(e: unknown, operation: string) {
    if (e instanceof BaPermissionError) {
      showToast({
        status: 'error',
        title: 'Update failed',
        description: e.message,
      });

      return;
    }

    // Validation errors are already rendered on the form fields.
    if (e instanceof BaError) {
      return;
    }

    console.error(`[${operation} error]: ${e}.`);

    showToast({
      status: 'error',
      title: 'Update failed',
      description: 'Sorry, an unexpected error occurred.',
    });
  }

  function handleCloseForm() {
    setFormTarget(null);
  }

  const isEditing = formTarget?.mode === 'edit';

  return (
    <div className="p-8 flex flex-col gap-6">
      <MediaLinksTable
        mediaLinks={mediaLinks}
        canEdit={canEditShelter}
        disabled={isSaving || deleting}
        onEdit={(mediaLink) => setFormTarget({ mode: 'edit', mediaLink })}
        onDelete={setPendingDelete}
      />

      {canEditShelter && (
        <Form.Actions
          onPrimaryClick={() => setFormTarget({ mode: 'create' })}
          primaryLabel="Add Media Link"
          primaryLeftIcon={<Plus size={20} />}
          className="z-99"
        />
      )}

      {/* Form modal */}
      <Modal
        isOpen={!!formTarget}
        onClose={handleCloseForm}
        size="sm"
        className="min-w-112"
      >
        <ModalHeader
          onClose={handleCloseForm}
          className="font-medium text-xl mb-4"
        >
          {isEditing ? 'Edit Media Link' : 'Add Media Link'}
        </ModalHeader>

        <ModalBody>
          {formTarget && (
            <ShelterMediaLinkForm
              defaultValues={
                formTarget.mode === 'edit'
                  ? toFormValues(formTarget.mediaLink)
                  : defaultFormValues
              }
              onSubmit={
                formTarget.mode === 'edit' ? handleUpdate : handleCreate
              }
              onCancel={handleCloseForm}
              disabled={isSaving}
            />
          )}
        </ModalBody>
      </Modal>

      {/* Delete Confirmation modal */}
      <ConfirmationModal
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="Delete media link?"
        description="This media link will be permanently removed."
        variant="danger"
        primaryAction={{
          label: 'Delete',
          onClick: handleDelete,
          isLoading: deleting,
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => setPendingDelete(null),
        }}
      />
    </div>
  );
}
