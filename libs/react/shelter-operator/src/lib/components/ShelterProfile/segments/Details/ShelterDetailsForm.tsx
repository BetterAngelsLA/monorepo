import { zodResolver } from '@hookform/resolvers/zod';
import { mergeCss } from '@monorepo/react/shared';
import { Controller, useForm } from 'react-hook-form';
import { Dropdown } from '../../../base-ui/dropdown';
import { Form } from '../../../form/Form';
import { ACCESSIBILITY_OPTIONS, STORAGE_OPTIONS } from '../../constants';
import {
  detailsDefaultValues,
  DetailsFormData,
  detailsFormSchema,
} from './formSchema';

type TProps = {
  defaultValues?: Partial<DetailsFormData>;
  onSubmit?: (data: DetailsFormData) => void;
  isViewMode?: boolean;
  onEditClick?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
  className?: string;
};

export function ShelterDetailsForm(props: TProps) {
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
    formState: { isValid },
    // formState: { errors, isValid },
    reset,
  } = useForm<DetailsFormData>({
    resolver: zodResolver(detailsFormSchema),
    defaultValues: { ...detailsDefaultValues, ...defaultValues },
  });

  function handleCancel() {
    reset();
    onCancel?.();
  }

  return (
    <div className={mergeCss(['px-6 flex-col flex-1 pb-48', className])}>
      <Form className="flex-1">
        <Form.Header
          title="Shelter Details"
          onEditClick={isViewMode ? onEditClick : undefined}
          className="pl-5"
        />

        <form
          className="flex flex-col gap-10 mt-8"
          onSubmit={onSubmit ? handleSubmit(onSubmit) : undefined}
        >
          <Form.Block columns={3}>
            <Controller
              name="accessibility"
              control={control}
              render={({ field }) => (
                <Dropdown
                  isMulti={true}
                  value={ACCESSIBILITY_OPTIONS.filter((o) =>
                    field.value.includes(o.value)
                  )}
                  options={ACCESSIBILITY_OPTIONS}
                  onChange={(options) => {
                    field.onChange(options ? options.map((o) => o.value) : []);
                  }}
                  label="Accessibility"
                  isViewMode={isViewMode}
                  className="min-w-44"
                />
              )}
            />

            <Controller
              name="storage"
              control={control}
              render={({ field }) => (
                <Dropdown
                  isMulti={true}
                  value={STORAGE_OPTIONS.filter((o) =>
                    field.value.includes(o.value)
                  )}
                  options={STORAGE_OPTIONS}
                  onChange={(options) => {
                    field.onChange(options ? options.map((o) => o.value) : []);
                  }}
                  label="Storage"
                  isViewMode={isViewMode}
                  className="min-w-44"
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
