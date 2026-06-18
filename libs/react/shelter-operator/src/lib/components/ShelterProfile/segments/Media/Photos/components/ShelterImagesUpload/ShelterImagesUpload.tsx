import { zodResolver } from '@hookform/resolvers/zod';
import { MimeTypes } from '@monorepo/react/shared';
import { enumDisplayShelterPhotoTypeChoices } from '@monorepo/react/shelter';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Dropdown,
  toDropdownOptions,
} from '../../../../../../base-ui/dropdown';
import { FileUploadInput } from '../../../../../../base-ui/fileUpload';
import { useToast } from '../../../../../../base-ui/toast';
import { Form } from '../../../../../../form/Form';
import {
  defaultFormValues,
  formSchema,
  ShelterImagesUploadFormData,
} from './formSchema';
import {
  MAX_FILE_SIZE_BYTES,
  useShelterPhotoUpload,
} from './useShelterPhotoUpload';

const PHOTO_TYPE_OPTIONS = toDropdownOptions(
  enumDisplayShelterPhotoTypeChoices
);

type TProps = {
  shelterId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  onError?: (error: Error) => void;
};

export function ShelterImagesUpload(props: TProps) {
  const { shelterId, onSuccess, onCancel, onError } = props;

  const { uploadPhotos } = useShelterPhotoUpload();
  const { showToast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(data: ShelterImagesUploadFormData) {
    try {
      setIsSubmitting(true);

      await uploadPhotos({
        shelterId,
        files: data.files,
        photoType: data.photoType,
      });

      showToast({
        status: 'success',
        title: 'Images uploaded.',
      });

      onSuccess?.();
    } catch (err) {
      console.error(`[ShelterImagesUpload error]: ${err}.`);
      onError?.(err instanceof Error ? err : new Error('Upload failed'));
    } finally {
      setIsSubmitting(false);
    }
  }

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ShelterImagesUploadFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues,
  });

  function handleOnCancel() {
    reset();
    onCancel?.();
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-8 p-0 "
    >
      <Controller
        name="photoType"
        control={control}
        render={({ field }) => (
          <Dropdown
            label="Photo Type"
            labelVariant="offset"
            labelClassname="mb-2"
            required
            disabled={isSubmitting}
            options={PHOTO_TYPE_OPTIONS}
            value={
              PHOTO_TYPE_OPTIONS.find((o) => o.value === field.value) ?? null
            }
            onChange={(option) => field.onChange(option?.value ?? null)}
            placeholder="Select photo type"
            error={errors.photoType?.message}
          />
        )}
      />

      <Controller
        name="files"
        control={control}
        render={({ field }) => (
          <FileUploadInput
            label="Images"
            labelVariant="offset"
            labelClassname="mb-2"
            acceptedMimeTypes={[
              MimeTypes.JPEG,
              MimeTypes.PNG,
              MimeTypes.WEBP,
              MimeTypes.GIF,
            ]}
            maxFilesizeBytes={MAX_FILE_SIZE_BYTES}
            multiple
            disabled={isSubmitting}
            value={field.value}
            onChange={field.onChange}
            error={errors.files?.message}
            required
          />
        )}
      />

      <div className="flex justify-end">
        <Form.Actions
          className="p-0"
          variant="relative"
          onPrimaryClick={handleSubmit(onSubmit)}
          primaryLabel={isSubmitting ? 'Uploading...' : 'Upload'}
          primaryDisabled={isSubmitting}
          onSecondaryClick={handleOnCancel}
          secondaryDisabled={isSubmitting}
        />
      </div>
    </form>
  );
}
