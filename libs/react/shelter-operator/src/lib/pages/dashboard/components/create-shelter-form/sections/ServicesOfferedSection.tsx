import { memo } from 'react';
import {
  GENERAL_SERVICES_OPTIONS,
  HEALTH_SERVICES_OPTIONS,
  IMMEDIATE_NEEDS_OPTIONS,
  MEAL_SERVICES_OPTIONS,
  TRAINING_SERVICES_OPTIONS,
} from '../../../formOptions';
import { CheckboxGroup } from '../../../../../components/form/CheckboxGroup';
import { FormSection } from '../../../../../components/form/FormSection';
import { TextAreaField } from '../../../../../components/form/TextAreaField';
import type { SectionProps } from '../types';

export const ServicesOfferedSection = memo(function ServicesOfferedSection({
  data,
  onChange,
}: SectionProps) {
  return (
    <FormSection title="Services Offered">
      <CheckboxGroup
        name="immediate-needs"
        label="Immediate Needs"
        options={IMMEDIATE_NEEDS_OPTIONS}
        values={data.immediateNeeds}
        onChange={(values) => onChange('immediateNeeds', values)}
      />
      <CheckboxGroup
        name="general-services"
        label="General Services"
        options={GENERAL_SERVICES_OPTIONS}
        values={data.generalServices}
        onChange={(values) => onChange('generalServices', values)}
      />
      <CheckboxGroup
        name="health-services"
        label="Health Services"
        options={HEALTH_SERVICES_OPTIONS}
        values={data.healthServices}
        onChange={(values) => onChange('healthServices', values)}
      />
      <CheckboxGroup
        name="training-services"
        label="Training Services"
        options={TRAINING_SERVICES_OPTIONS}
        values={data.trainingServices}
        onChange={(values) => onChange('trainingServices', values)}
      />
      <CheckboxGroup
        name="meal-services"
        label="Meal Services"
        options={MEAL_SERVICES_OPTIONS}
        values={data.mealServices}
        onChange={(values) => onChange('mealServices', values)}
      />
      <TextAreaField
        id="other-services"
        name="otherServices"
        label="Other Services"
        value={data.otherServices}
        onChange={(value) => onChange('otherServices', value)}
        rows={3}
      />
    </FormSection>
  );
});
