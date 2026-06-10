import { memo } from 'react';
import {
  ACCESSIBILITY_OPTIONS,
  DEMOGRAPHICS_OPTIONS,
  FUNDERS_OPTIONS,
  PETS_OPTIONS,
} from '../../../../pages/dashboard/formOptions';
import { CheckboxGroup } from '../../../form/CheckboxGroup';
import { FormSection } from '../../../form/FormSection';
import { NumberField } from '../../../form/NumberField';
import { RadioGroup } from '../../../form/RadioGroup';
import { BOOLEAN_OPTIONS } from '../constants/bedFormOptions';
import type { SectionProps } from '../types';

export const BedDetailsSection = memo(function BedDetailsSection({
  data,
  onChange,
  errors,
}: SectionProps) {
  return (
    <FormSection title="Bed Details">
      <CheckboxGroup
        name="demographics"
        label="Demographics"
        options={DEMOGRAPHICS_OPTIONS}
        values={data.demographics}
        onChange={(values) => onChange('demographics', values)}
        error={errors.demographics}
      />
      <CheckboxGroup
        name="accessibility"
        label="Accessibility"
        options={ACCESSIBILITY_OPTIONS}
        values={data.accessibility}
        onChange={(values) => onChange('accessibility', values)}
        error={errors.accessibility}
      />
      <CheckboxGroup
        name="funders"
        label="Funders"
        options={FUNDERS_OPTIONS}
        values={data.funders}
        onChange={(values) => onChange('funders', values)}
        error={errors.funders}
      />
      <CheckboxGroup
        name="pets"
        label="Pets"
        options={PETS_OPTIONS}
        values={data.pets}
        onChange={(values) => onChange('pets', values)}
        error={errors.pets}
      />
      <RadioGroup
        name="storage"
        label="Storage Available"
        options={BOOLEAN_OPTIONS}
        value={data.storage}
        onChange={(value) => onChange('storage', value)}
      />
      <RadioGroup
        name="maintenanceFlag"
        label="Maintenance Flag"
        options={BOOLEAN_OPTIONS}
        value={data.maintenanceFlag}
        onChange={(value) => onChange('maintenanceFlag', value)}
      />
      <RadioGroup
        name="b7"
        label="B7"
        options={BOOLEAN_OPTIONS}
        value={data.b7}
        onChange={(value) => onChange('b7', value)}
      />
      <NumberField
        id="bed-fees"
        name="fees"
        label="Fees"
        value={data.fees}
        onChange={(value) => onChange('fees', value)}
        min={0}
        step={1}
        error={errors.fees}
      />
    </FormSection>
  );
});
