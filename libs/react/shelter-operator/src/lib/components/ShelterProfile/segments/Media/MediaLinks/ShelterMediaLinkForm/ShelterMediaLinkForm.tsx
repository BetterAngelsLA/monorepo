import { zodResolver } from '@hookform/resolvers/zod';
import { mergeCss } from '@monorepo/react/shared';
import {
  enumDisplayMediaLinkTypeChoices,
  MediaLinkTypeChoices,
} from '@monorepo/react/shelter';
import type { UseFormSetError } from 'react-hook-form';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Dropdown, toDropdownOptions } from '../../../../../base-ui/dropdown';
import { Input } from '../../../../../base-ui/input';
import { Form } from '../../../../../form/Form';
import { formSchema, type MediaLinkFormData } from './formSchema';

const MEDIA_TYPE_INPUT_CONFIG: Record<
  MediaLinkTypeChoices,
  { label: string; placeholder: string }
> = {
  [MediaLinkTypeChoices.Youtube]: {
    label: 'YouTube',
    placeholder: 'https://www.youtube.com/watch?v=...',
  },
};

const MEDIA_TYPE_OPTIONS = toDropdownOptions(enumDisplayMediaLinkTypeChoices);

type TProps = {
  defaultValues: MediaLinkFormData;
  onSubmit: (
    data: MediaLinkFormData,
    setError: UseFormSetError<MediaLinkFormData>,
  ) => void;
  onCancel?: () => void;
  disabled?: boolean;
  className?: string;
};

export function ShelterMediaLinkForm(props: TProps) {
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
    setError,
  } = useForm<MediaLinkFormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const mediaType = useWatch({ control, name: 'mediaType' });

  return (
    <div className={mergeCss(['flex-col flex-1', className])}>
      <form className="flex flex-col gap-6">
        <Controller
          name="mediaType"
          control={control}
          render={({ field }) => (
            <Dropdown
              label="Media Type"
              labelVariant="offset"
              labelClassname="mb-2"
              required
              disabled={disabled}
              options={MEDIA_TYPE_OPTIONS}
              value={
                MEDIA_TYPE_OPTIONS.find((o) => o.value === field.value) ?? null
              }
              onChange={(option) => {
                field.onChange(option?.value ?? null);
              }}
              error={errors.mediaType?.message}
            />
          )}
        />

        <Controller
          name="url"
          control={control}
          render={({ field }) => (
            <Input
              label={`${MEDIA_TYPE_INPUT_CONFIG[mediaType].label} URL`}
              labelVariant="offset"
              placeholder={MEDIA_TYPE_INPUT_CONFIG[mediaType].placeholder}
              dataType="url"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              disabled={disabled}
              required={true}
              error={errors.url?.message}
            />
          )}
        />

        <Controller
          name="title"
          control={control}
          render={({ field }) => (
            <Input
              label="Title"
              labelVariant="offset"
              dataType="string"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              disabled={disabled}
              error={errors.title?.message}
            />
          )}
        />

        <Form.Actions
          className="ml-auto"
          variant="relative"
          primaryLabel={disabled ? 'Saving...' : 'Save'}
          primaryDisabled={disabled}
          onPrimaryClick={handleSubmit((data) => onSubmit(data, setError))}
          secondaryLabel="Cancel"
          onSecondaryClick={onCancel}
          secondaryDisabled={disabled}
        />
      </form>
    </div>
  );
}
