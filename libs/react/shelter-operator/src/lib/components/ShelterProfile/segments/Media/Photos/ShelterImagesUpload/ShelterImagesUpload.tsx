import { zodResolver } from '@hookform/resolvers/zod';
import { MimeTypes } from '@monorepo/react/shared';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ShelterPhotoTypeChoices } from '../../../../../../apollo/graphql/__generated__/types';
import { Dropdown, type DropdownOption } from '../../../../../base-ui/dropdown';
import { FileUploadInput } from '../../../../../base-ui/fileUpload';
import { useToast } from '../../../../../base-ui/toast';
import { Form } from '../../../../../form/Form';
import {
  defaultFormValues,
  formSchema,
  ShelterImagesUploadFormData,
} from './formSchema';
import { useShelterPhotoUpload } from './useShelterPhotoUpload/useShelterPhotoUpload';

const PHOTO_TYPE_OPTIONS: DropdownOption<ShelterPhotoTypeChoices>[] = [
  { label: 'Interior', value: ShelterPhotoTypeChoices.Interior },
  { label: 'Exterior', value: ShelterPhotoTypeChoices.Exterior },
];

type TProps = {
  shelterId: string;
  onSuccess?: () => void;
};

export function ShelterImagesUpload(props: TProps) {
  const { shelterId, onSuccess } = props;

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

      showToast({
        status: 'error',
        title: 'Update failed',
        description: 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ShelterImagesUploadFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues,
  });

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
            options={PHOTO_TYPE_OPTIONS}
            value={
              PHOTO_TYPE_OPTIONS.find((o) => o.value === field.value) ?? null
            }
            onChange={(option) => field.onChange(option?.value ?? null)}
            placeholder="Select photo type"
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
            acceptedMimeTypes={[MimeTypes.PNG, MimeTypes.JPEG, MimeTypes.WEBP]}
            multiple
            value={field.value}
            onChange={field.onChange}
            error={errors.files?.message}
            isTouched={!!errors.files}
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
          onSecondaryClick={() => undefined}
          secondaryDisabled={isSubmitting}
        />
      </div>
    </form>
  );
}
