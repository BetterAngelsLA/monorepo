import { zodResolver } from '@hookform/resolvers/zod';
import { mergeCss } from '@monorepo/react/shared';
import { FunderChoices } from '@monorepo/react/shelter';
import { Controller, useForm } from 'react-hook-form';
import { useShelterCities } from '../../../../hooks';
import { useShelterSpas } from '../../../../hooks/useShelterSpas/useShelterSpas';
import { ComboBox } from '../../../base-ui/combo-box';
import { Dropdown } from '../../../base-ui/dropdown';
import { Form } from '../../../form/Form';
import {
  FUNDERS_OPTIONS,
  LA_CITY_COUNCIL_DISTRICT_OPTIONS,
  LA_SUPERVISORIAL_DISTRICT_OPTIONS,
  SEARCHABLE_DROPDOWN_MIN,
  SHELTER_PROGRAMS_OPTIONS,
} from '../../constants';
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
    formState: { isValid, errors },
    reset,
  } = useForm<EcosystemFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { ...defaultFormValues, ...defaultValues },
    mode: 'onBlur',
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
                  isSearchable={cities.length > SEARCHABLE_DROPDOWN_MIN}
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
                  isSearchable={cities.length > SEARCHABLE_DROPDOWN_MIN}
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
                  isSearchable={spas.length > SEARCHABLE_DROPDOWN_MIN}
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
                  isSearchable={spas.length > SEARCHABLE_DROPDOWN_MIN}
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
                />
              )}
            />
          </Form.Block>

          <Form.Block columns={2}>
            <Controller
              name="cityCouncilDistrict"
              control={control}
              render={({ field }) => (
                <Dropdown
                  label="City Council District"
                  placeholder="Select a district"
                  value={
                    LA_CITY_COUNCIL_DISTRICT_OPTIONS.find(
                      (option) => option.value === field.value
                    ) ?? null
                  }
                  options={LA_CITY_COUNCIL_DISTRICT_OPTIONS}
                  onChange={(option) => {
                    field.onChange(option?.value ?? null);
                  }}
                  isViewMode={isViewMode}
                  disabled={disabled}
                />
              )}
            />

            <Controller
              name="supervisorialDistrict"
              control={control}
              render={({ field }) => (
                <Dropdown
                  label="Supervisorial District"
                  placeholder="Select a district"
                  value={
                    LA_SUPERVISORIAL_DISTRICT_OPTIONS.find(
                      (option) => option.value === field.value
                    ) ?? null
                  }
                  options={LA_SUPERVISORIAL_DISTRICT_OPTIONS}
                  onChange={(option) => {
                    field.onChange(option?.value ?? null);
                  }}
                  isViewMode={isViewMode}
                  disabled={disabled}
                />
              )}
            />
          </Form.Block>

          <Form.Block columns={2}>
            <Controller
              name="shelterPrograms"
              control={control}
              render={({ field }) => (
                <Dropdown
                  label="Shelter Programs"
                  isMulti={true}
                  isSearchable={cities.length > SEARCHABLE_DROPDOWN_MIN}
                  value={SHELTER_PROGRAMS_OPTIONS.filter((o) =>
                    field.value.includes(o.value)
                  )}
                  options={SHELTER_PROGRAMS_OPTIONS}
                  onChange={(options) => {
                    field.onChange(options ? options.map((o) => o.value) : []);
                  }}
                  isViewMode={isViewMode}
                />
              )}
            />

            <ComboBox
              control={control}
              name="funders"
              inputName="fundersOther"
              label="Funders"
              inputLabel="Other Funder"
              isSearchable={cities.length > SEARCHABLE_DROPDOWN_MIN}
              options={FUNDERS_OPTIONS}
              triggerValue={FunderChoices.Other}
              inputError={errors.fundersOther?.message}
              isViewMode={isViewMode}
              disabled={disabled}
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
