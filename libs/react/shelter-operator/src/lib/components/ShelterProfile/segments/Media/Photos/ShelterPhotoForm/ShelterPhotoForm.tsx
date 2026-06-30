import { zodResolver } from '@hookform/resolvers/zod';
import { mergeCss } from '@monorepo/react/shared';
import { enumDisplayShelterPhotoTypeChoices } from '@monorepo/react/shelter';
import { Controller, useForm } from 'react-hook-form';
import { Dropdown, toDropdownOptions } from '../../../../../base-ui/dropdown';
import { Form } from '../../../../../form/Form';
import { formSchema, type ShelterPhotoFormData } from './formSchema';

const PHOTO_TYPE_OPTIONS = toDropdownOptions(
  enumDisplayShelterPhotoTypeChoices
);

type TProps = {
  defaultValues: ShelterPhotoFormData;
  onSubmit: (data: ShelterPhotoFormData) => void;
  onCancel?: () => void;
  disabled?: boolean;
  className?: string;
};

export function ShelterPhotoForm(props: TProps) {
  const {
    defaultValues,
    onSubmit,
    onCancel,
    disabled = false,
    className,
  } = props;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ShelterPhotoFormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: 'onBlur',
  });

  return (
    <div className={mergeCss(['flex-col flex-1', className])}>
      <form className="flex flex-col gap-6">
        <Controller
          name="photoType"
          control={control}
          render={({ field }) => (
            <Dropdown
              label="Photo Type"
              labelVariant="offset"
              labelClassname="mb-2"
              required
              disabled={disabled}
              options={PHOTO_TYPE_OPTIONS}
              value={
                PHOTO_TYPE_OPTIONS.find((o) => o.value === field.value) ?? null
              }
              onChange={(option) => {
                field.onChange(option?.value ?? null);
              }}
              error={errors.photoType?.message}
            />
          )}
        />

        <Form.Actions
          className="ml-auto"
          variant="relative"
          primaryLabel={disabled ? 'Saving...' : 'Save'}
          primaryDisabled={disabled}
          onPrimaryClick={handleSubmit(onSubmit)}
          secondaryLabel="Cancel"
          onSecondaryClick={onCancel}
          secondaryDisabled={disabled}
        />
      </form>
    </div>
  );
}
