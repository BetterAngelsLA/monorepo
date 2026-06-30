import { memo } from 'react';
import { Controller } from 'react-hook-form';
import { CheckboxGroup } from '../../../form/CheckboxGroup';
import { FormSection } from '../../../form/FormSection';
import { NumberField } from '../../../form/NumberField';
import { RadioGroup } from '../../../form/RadioGroup';
import {
  BOOLEAN_OPTIONS,
  MEDICAL_NEED_OPTIONS,
} from '../constants/bedFormOptions';
import type { SectionProps } from '../types';

export const BedDetailsSection = memo(function BedDetailsSection({
  control,
  errors,
  filteredPropertyOptions,
}: SectionProps) {
  return (
    <FormSection title="Bed Details">
      <Controller
        name="demographics"
        control={control}
        render={({ field }) => (
          <CheckboxGroup
            name="demographics"
            label="Demographics"
            options={filteredPropertyOptions?.demographics ?? []}
            values={field.value}
            onChange={field.onChange}
            error={errors.demographics?.message}
          />
        )}
      />
      <Controller
        name="accessibility"
        control={control}
        render={({ field }) => (
          <CheckboxGroup
            name="accessibility"
            label="Accessibility"
            options={filteredPropertyOptions?.accessibility ?? []}
            values={field.value}
            onChange={field.onChange}
            error={errors.accessibility?.message}
          />
        )}
      />
      <Controller
        name="medicalNeeds"
        control={control}
        render={({ field }) => (
          <CheckboxGroup
            name="medicalNeeds"
            label="Medical Needs"
            options={MEDICAL_NEED_OPTIONS}
            values={field.value}
            onChange={field.onChange}
            error={errors.medicalNeeds?.message}
          />
        )}
      />
      <Controller
        name="funders"
        control={control}
        render={({ field }) => (
          <CheckboxGroup
            name="funders"
            label="Funders"
            options={filteredPropertyOptions?.funders ?? []}
            values={field.value}
            onChange={field.onChange}
            error={errors.funders?.message}
          />
        )}
      />
      <Controller
        name="pets"
        control={control}
        render={({ field }) => (
          <CheckboxGroup
            name="pets"
            label="Pets"
            options={filteredPropertyOptions?.pets ?? []}
            values={field.value}
            onChange={field.onChange}
            error={errors.pets?.message}
          />
        )}
      />
      <Controller
        name="storage"
        control={control}
        render={({ field }) => (
          <RadioGroup
            name="storage"
            label="Storage Available"
            options={BOOLEAN_OPTIONS}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
      <Controller
        name="maintenanceFlag"
        control={control}
        render={({ field }) => (
          <RadioGroup
            name="maintenanceFlag"
            label="Maintenance Flag"
            options={BOOLEAN_OPTIONS}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
      <Controller
        name="b7"
        control={control}
        render={({ field }) => (
          <RadioGroup
            name="b7"
            label="B7"
            options={BOOLEAN_OPTIONS}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
      <Controller
        name="fees"
        control={control}
        render={({ field }) => (
          <NumberField
            id="bed-fees"
            name="fees"
            label="Fees"
            value={field.value}
            onChange={field.onChange}
            min={0}
            step={1}
            error={errors.fees?.message}
          />
        )}
      />
    </FormSection>
  );
});
