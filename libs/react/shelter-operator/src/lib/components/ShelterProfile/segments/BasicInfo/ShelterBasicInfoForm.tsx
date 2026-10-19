import { zodResolver } from '@hookform/resolvers/zod';
import { FormattedDate } from '@monorepo/react/components';
import { mergeCss } from '@monorepo/react/shared';
import { enumStatusChoices } from '@monorepo/react/shelter';
import { useMemo } from 'react';
import { Controller, UseFormSetError, useForm } from 'react-hook-form';
import { LocationPicker } from '../../../../pages/dashboard/components/LocationPicker';
import {
  Dropdown,
  DropdownChip,
  toDropdownValue,
  type DropdownOption,
} from '../../../base-ui/dropdown';
import { Input } from '../../../base-ui/input';
import { RichTextEditor } from '../../../base-ui/richTextEditor';
import { Switch } from '../../../base-ui/switch';
import { Text } from '../../../base-ui/text/text';
import { Form } from '../../../form/Form';
import {
  SEARCHABLE_DROPDOWN_MIN,
  STATUS_COLOR_MAP,
  STATUS_OPTIONS,
} from '../../constants';
import { InstagramField } from './components/InstagramField';
import {
  defaultFormValues,
  formSchema,
  type BasicInfoFormData,
} from './formSchema';

type OrganizationField = {
  options: readonly DropdownOption<string>[];
  isLoading?: boolean;
};

type TProps = {
  values?: Partial<BasicInfoFormData>;
  onSubmit: (
    data: BasicInfoFormData,
    setError: UseFormSetError<BasicInfoFormData>,
  ) => void;
  isViewMode?: boolean;
  onEditClick?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
  className?: string;
  /** When provided, renders an Organization dropdown (create form, global
   * operators only). */
  organizationField?: OrganizationField;
  /** When provided, renders a read-only meta block (gray container) at the
   * bottom of the form — used for admin info such as the last-updated
   * timestamp. */
  updatedAt?: string | null;
};

export function ShelterBasicInfoForm(props: TProps) {
  const {
    values,
    onSubmit,
    isViewMode = false,
    onEditClick,
    onCancel,
    disabled = false,
    className,
    organizationField,
    updatedAt,
  } = props;

  const initialValues = useMemo(
    () => ({ ...defaultFormValues, ...values }),
    [values],
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
  } = useForm<BasicInfoFormData>({
    resolver: zodResolver(formSchema),
    values: initialValues,
    mode: 'onBlur',
  });

  function handleCancel() {
    reset(initialValues);
    onCancel?.();
  }

  return (
    <div className={mergeCss(['px-6 flex-col flex-1 pb-48', className])}>
      <Form className="flex-1">
        <Form.Header
          title="Basic Information"
          onEditClick={isViewMode ? onEditClick : undefined}
          className="pl-5"
        />

        <Form.Content>
          <Form.Block columns={2} className="md:gap-18 md:grid-cols-[1fr_auto]">
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  label="Name"
                  dataType="string"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  disabled={disabled}
                  required={true}
                  isViewMode={isViewMode}
                  error={errors.name?.message}
                />
              )}
            />

            <div className="flex gap-6">
              <Controller
                name="isPrivate"
                control={control}
                render={({ field }) => (
                  <Switch
                    label="Private"
                    value={field.value}
                    onChange={field.onChange}
                    disabled={disabled}
                    isViewMode={isViewMode}
                  />
                )}
              />

              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    value={toDropdownValue(field.value, enumStatusChoices)}
                    options={STATUS_OPTIONS}
                    onChange={(option) => {
                      if (option && !Array.isArray(option)) {
                        field.onChange(option.value);
                      }
                    }}
                    renderValue={(selected) => {
                      const value = selected[0];

                      return (
                        <DropdownChip
                          option={value}
                          colorMap={STATUS_COLOR_MAP}
                        />
                      );
                    }}
                    label="Status"
                    isViewMode={isViewMode}
                    className="min-w-44"
                  />
                )}
              />
            </div>
          </Form.Block>
          {organizationField && (
            <Form.Block columns={2}>
              <Controller
                name="organizationId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    label="Organization"
                    placeholder="Select an organization"
                    options={organizationField.options}
                    value={
                      organizationField.options.find(
                        (option) => option.value === field.value,
                      ) ?? null
                    }
                    onChange={(option) => {
                      if (option && !Array.isArray(option)) {
                        field.onChange(option.value);
                      }
                    }}
                    isSearchable={
                      organizationField.options.length > SEARCHABLE_DROPDOWN_MIN
                    }
                    disabled={disabled || organizationField.isLoading}
                    required={true}
                    error={errors.organizationId?.message}
                  />
                )}
              />
            </Form.Block>
          )}

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                label="Description"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                disabled={disabled}
                isViewMode={isViewMode}
                error={errors.description?.message}
              />
            )}
          />

          <Controller
            name="location"
            control={control}
            render={({ field }) => (
              <LocationPicker
                value={field.value ?? null}
                onChange={field.onChange}
                error={errors.location?.message}
                label="Location"
                expandable={true}
                isViewMode={isViewMode}
              />
            )}
          />

          <Form.Block>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  label="Email"
                  dataType="email"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  disabled={disabled}
                  isViewMode={isViewMode}
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <Input
                  label="Phone"
                  dataType="phone-number"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  disabled={disabled}
                  isViewMode={isViewMode}
                  error={errors.phone?.message}
                />
              )}
            />

            <Controller
              name="website"
              control={control}
              render={({ field }) => (
                <Input
                  label="Website"
                  dataType="url"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  disabled={disabled}
                  isViewMode={isViewMode}
                  error={errors.website?.message}
                />
              )}
            />
          </Form.Block>

          <Form.Block>
            <InstagramField
              control={control}
              error={errors.instagram?.message}
              isViewMode={isViewMode}
              disabled={disabled}
            />
          </Form.Block>

          {!!updatedAt && (
            <Form.Meta>
              <Text variant="caption" className="text-gray-500">
                Last updated:{' '}
                <FormattedDate value={updatedAt} appendRelative={true} />
              </Text>
            </Form.Meta>
          )}

          {!isViewMode && (
            <Form.Actions
              onPrimaryClick={handleSubmit((data) => onSubmit(data, setError))}
              onSecondaryClick={handleCancel}
              primaryDisabled={disabled}
              secondaryDisabled={disabled}
              className="z-99"
            />
          )}
        </Form.Content>
      </Form>
    </div>
  );
}
