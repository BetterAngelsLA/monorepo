import { zodResolver } from '@hookform/resolvers/zod';
import { mergeCss } from '@monorepo/react/shared';
import { enumDisplayMediaLinkTypeChoices } from '@monorepo/react/shelter';
import type { UseFormSetError } from 'react-hook-form';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Dropdown, toDropdownOptions } from '../../../../../base-ui/dropdown';
import { Form } from '../../../../../form/Form';
import { TextField } from '../../../../../form/TextField';
import { formSchema, getUrlRule, type MediaLinkFormData } from './formSchema';

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
  const urlRule = getUrlRule(mediaType);

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
            <TextField
              id="media-link-url"
              name="url"
              label={`${urlRule.label} URL`}
              placeholder={urlRule.placeholder}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.url?.message}
              required
            />
          )}
        />

        <Controller
          name="title"
          control={control}
          render={({ field }) => (
            <TextField
              id="media-link-title"
              name="title"
              label="Title"
              helperText="Optional."
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
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
