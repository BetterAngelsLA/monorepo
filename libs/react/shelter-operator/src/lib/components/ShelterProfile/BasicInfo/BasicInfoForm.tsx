import { zodResolver } from '@hookform/resolvers/zod';
import { mergeCss } from '@monorepo/react/shared';
import { Controller, useForm } from 'react-hook-form';
import { LocationPicker } from '../../../pages/dashboard/components/create-shelter-form/components/LocationPicker';
import { Input } from '../../base-ui/input';
import { Switch } from '../../base-ui/switch';
import { Form } from '../../form/Form';
import {
  type BasicInfoFormData,
  basicInfoDefaultValues,
  basicInfoFormSchema,
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

export function BasicInfoForm(props: TProps) {
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
    resolver: zodResolver(basicInfoFormSchema),
    defaultValues: { ...basicInfoDefaultValues, ...defaultValues },
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

        <form
          className="flex flex-col gap-10 mt-8"
          onSubmit={onSubmit ? handleSubmit(onSubmit) : undefined}
        >
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
          </Form.Block>

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Input
                required
                variant="paragraph"
                inputClassName="min-h-auto"
                rows={2}
                label="Description"
                dataType="string"
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
                  //   dataType="string"
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
            />
          )}
        </form>
      </Form>
    </div>
  );
}
