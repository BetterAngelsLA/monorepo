import { memo } from 'react';
import { Controller } from 'react-hook-form';
import { CheckboxGroup } from '../../../form/CheckboxGroup';
import { FormSection } from '../../../form/FormSection';
import { RadioGroup } from '../../../form/RadioGroup';
import { BOOLEAN_OPTIONS } from '../constants/roomFormOptions';
import type { SectionProps } from '../types';

export const RoomDetailsSection = memo(function RoomDetailsSection({
  control,
  errors,
  filteredPropertyOptions,
}: SectionProps) {
  return (
    <FormSection title="Room Details">
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
    </FormSection>
  );
});
