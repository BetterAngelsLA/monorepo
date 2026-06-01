// ShelterServicesForm

import { zodResolver } from '@hookform/resolvers/zod';
import { mergeCss } from '@monorepo/react/shared';
import { Controller, useForm } from 'react-hook-form';
import { Input } from '../../../base-ui/input';
import { Form } from '../../../form/Form';
import { defaultFormValues, formSchema, ServicesFormData } from './formSchema';

type TProps = {
  defaultValues?: Partial<ServicesFormData>;
  onSubmit?: (data: ServicesFormData) => void;
  isViewMode?: boolean;
  onEditClick?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
  className?: string;
};

export function ShelterServicesForm(props: TProps) {
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
  } = useForm<ServicesFormData>({
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
          title="Shelter Services"
          onEditClick={isViewMode ? onEditClick : undefined}
          className="pl-5"
        />

        <form className="flex flex-col gap-10 mt-8">
          {/* <Form.Block columns={3}></Form.Block> */}

          <Controller
            name="otherRules"
            control={control}
            render={({ field }) => (
              <Input
                label="Other Rules"
                variant="paragraph"
                inputClassName="min-h-auto"
                rows={2}
                dataType="string"
                value={field.value ?? ''}
                onChange={(event) => {
                  const value = event.target.value;
                  field.onChange(value === '' ? null : value);
                }}
                onBlur={field.onBlur}
                disabled={disabled}
                isViewMode={isViewMode}
                error={errors.otherRules?.message}
              />
            )}
          />

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
