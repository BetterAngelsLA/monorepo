import { zodResolver } from '@hookform/resolvers/zod';
import { mergeCss } from '@monorepo/react/shared';
import { Controller, useForm } from 'react-hook-form';
import { useShelterCities } from '../../../../hooks';
import { useShelterSpas } from '../../../../hooks/useShelterSpas/useShelterSpas';
import { Dropdown } from '../../../base-ui/dropdown';
import { Form } from '../../../form/Form';
import { defaultFormValues, EcosystemFormData, formSchema } from './formSchema';

type TProps = {
  defaultValues?: Partial<EcosystemFormData>;
  onSubmit?: (data: EcosystemFormData) => void;
  isViewMode?: boolean;
  onEditClick?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
  className?: string;
};

export function ShelterEcosystemForm(props: TProps) {
  const {
    defaultValues,
    onSubmit,
    isViewMode = false,
    onEditClick,
    onCancel,
    disabled = false,
    className,
  } = props;

  const { cities } = useShelterCities();
  const { spas } = useShelterSpas();

  const {
    control,
    handleSubmit,
    formState: { isValid },
    reset,
  } = useForm<EcosystemFormData>({
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
          title="Shelter Ecosystem"
          onEditClick={isViewMode ? onEditClick : undefined}
          className="pl-5"
        />

        <form
          className="flex flex-col gap-10 mt-8"
          onSubmit={onSubmit ? handleSubmit(onSubmit) : undefined}
        >
          <Form.Block columns={2}>
            <Controller
              name="city"
              control={control}
              render={({ field }) => (
                <Dropdown
                  label="City"
                  placeholder="Select a city"
                  isSearchable={cities.length > 6}
                  options={cities.map((option) => ({
                    label: option.name,
                    value: option.id,
                  }))}
                  value={
                    field.value
                      ? { label: field.value.name, value: field.value.id }
                      : null
                  }
                  onChange={(option) => {
                    field.onChange(
                      option ? { id: option.value, name: option.label } : null
                    );
                  }}
                  isViewMode={isViewMode}
                  disabled={disabled}
                  className="min-w-44"
                />
              )}
            />

            <Controller
              name="citiesServed"
              control={control}
              render={({ field }) => (
                <Dropdown
                  label="Cities Served"
                  placeholder="Select cities"
                  isSearchable={cities.length > 6}
                  isMulti={true}
                  options={cities.map((option) => ({
                    label: option.name,
                    value: option.id,
                  }))}
                  value={field.value.map((option) => ({
                    label: option.name,
                    value: option.id,
                  }))}
                  onChange={(options) => {
                    field.onChange(
                      (options ?? []).map((option) => ({
                        id: option.value,
                        name: option.label,
                      }))
                    );
                  }}
                  isViewMode={isViewMode}
                  disabled={disabled}
                  className="min-w-44"
                />
              )}
            />
          </Form.Block>
          <Form.Block columns={2}>
            <Controller
              name="spa"
              control={control}
              render={({ field }) => (
                <Dropdown
                  label="SPA"
                  placeholder="Select a SPA"
                  isSearchable={spas.length > 6}
                  options={spas.map((option) => ({
                    label: option.name,
                    value: option.id,
                  }))}
                  value={
                    field.value
                      ? { label: field.value.name, value: field.value.id }
                      : null
                  }
                  onChange={(option) => {
                    field.onChange(
                      option ? { id: option.value, name: option.label } : null
                    );
                  }}
                  isViewMode={isViewMode}
                  disabled={disabled}
                  className="min-w-44"
                />
              )}
            />

            <Controller
              name="spasServed"
              control={control}
              render={({ field }) => (
                <Dropdown
                  label="SPAs Served"
                  placeholder="Select SPAs"
                  isSearchable={spas.length > 6}
                  isMulti={true}
                  options={spas.map((option) => ({
                    label: option.name,
                    value: option.id,
                  }))}
                  value={field.value.map((option) => ({
                    label: option.name,
                    value: option.id,
                  }))}
                  onChange={(options) => {
                    field.onChange(
                      (options ?? []).map((option) => ({
                        id: option.value,
                        name: option.label,
                      }))
                    );
                  }}
                  isViewMode={isViewMode}
                  disabled={disabled}
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
