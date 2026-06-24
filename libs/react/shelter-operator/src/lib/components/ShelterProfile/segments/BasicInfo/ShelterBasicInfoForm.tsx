import { zodResolver } from '@hookform/resolvers/zod';
import { mergeCss } from '@monorepo/react/shared';
import { enumStatusChoices } from '@monorepo/react/shelter';
import { Controller, useForm } from 'react-hook-form';
import { LocationPicker } from '../../../../pages/dashboard/components/create-shelter-form/components/LocationPicker';
import {
  Dropdown,
  DropdownChip,
  toDropdownValue,
} from '../../../base-ui/dropdown';
import { Input } from '../../../base-ui/input';
import { RichTextEditor } from '../../../base-ui/richTextEditor';
import { Switch } from '../../../base-ui/switch';
import { Form } from '../../../form/Form';
import { STATUS_COLOR_MAP, STATUS_OPTIONS } from '../../constants';
import {
  defaultFormValues,
  formSchema,
  type BasicInfoFormData,
} from './formSchema';

type TProps = {
  defaultValues?: Partial<BasicInfoFormData>;
  onSubmit?: (data: BasicInfoFormData) => void;
  isViewMode?: boolean;
  onEditClick?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
  className?: string;
};

export function ShelterBasicInfoForm(props: TProps) {
  const {
    defaultValues,
    onSubmit,
    isViewMode = false,
    onEditClick,
    onCancel,
    disabled = false,
    className,
  } = props;

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<BasicInfoFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { ...defaultFormValues, ...defaultValues },
  });

  function handleCancel() {
    reset();
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

        <form className="flex flex-col gap-10 mt-8">
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

          {!isViewMode && onSubmit && (
            <Form.Actions
              onPrimaryClick={() => handleSubmit(onSubmit)()}
              onSecondaryClick={handleCancel}
              primaryDisabled={disabled || !isValid}
              secondaryDisabled={disabled}
              className="z-99"
            />
          )}
        </form>
      </Form>
    </div>
  );
}
