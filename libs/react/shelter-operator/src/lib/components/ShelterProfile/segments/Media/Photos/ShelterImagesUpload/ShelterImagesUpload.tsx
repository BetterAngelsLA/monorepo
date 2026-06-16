import { zodResolver } from '@hookform/resolvers/zod';
import { MimeTypes } from '@monorepo/react/shared';
import { Controller, useForm } from 'react-hook-form';
import { ShelterPhotoTypeChoices } from '../../../../../../apollo/graphql/__generated__/types';
import { Dropdown, type DropdownOption } from '../../../../../base-ui/dropdown';
import { FileUploadInput } from '../../../../../base-ui/fileUpload';
import { Form } from '../../../../../form/Form';
import {
  defaultFormValues,
  formSchema,
  ShelterImagesUploadFormData,
} from './formSchema';

const PHOTO_TYPE_OPTIONS: DropdownOption<ShelterPhotoTypeChoices>[] = [
  { label: 'Interior', value: ShelterPhotoTypeChoices.Interior },
  { label: 'Exterior', value: ShelterPhotoTypeChoices.Exterior },
];

type TProps = {
  onSubmit: (data: ShelterImagesUploadFormData) => void;
};

export function ShelterImagesUpload(props: TProps) {
  const { onSubmit } = props;

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
          onPrimaryClick={() => undefined}
          primaryLabel="Upload"
          onSecondaryClick={() => undefined}
        />
      </div>
    </form>
  );
}
