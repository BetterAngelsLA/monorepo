import {
  GENERAL_SERVICES_OPTIONS,
  HEALTH_SERVICES_OPTIONS,
  IMMEDIATE_NEEDS_OPTIONS,
  MEAL_SERVICES_OPTIONS,
  TRAINING_SERVICES_OPTIONS,
} from '../../../types';
import { CheckboxGroup } from '../components/CheckboxGroup';
import { FormSection } from '../components/FormSection';
import { TextAreaField } from '../components/TextAreaField';
import type { SectionProps } from '../types';
import { mapToCheckboxOptions } from '../utils/formUtils';

const immediateNeedsOptions = mapToCheckboxOptions(IMMEDIATE_NEEDS_OPTIONS);
const generalServicesOptions = mapToCheckboxOptions(GENERAL_SERVICES_OPTIONS);
const healthServicesOptions = mapToCheckboxOptions(HEALTH_SERVICES_OPTIONS);
const trainingServicesOptions = mapToCheckboxOptions(TRAINING_SERVICES_OPTIONS);
const mealServicesOptions = mapToCheckboxOptions(MEAL_SERVICES_OPTIONS);

export function ServicesOfferedSection({ data, onChange }: SectionProps) {
  return (
    <FormSection title="Services Offered">
      <CheckboxGroup
        name="immediate-needs"
        label="Immediate Needs"
        options={immediateNeedsOptions}
        values={data.immediate_needs}
        onChange={values => onChange('immediate_needs', values)}
      />
      <CheckboxGroup
        name="general-services"
        label="General Services"
        options={generalServicesOptions}
        values={data.general_services}
        onChange={values => onChange('general_services', values)}
      />
      <CheckboxGroup
        name="health-services"
        label="Health Services"
        options={healthServicesOptions}
        values={data.health_services}
        onChange={values => onChange('health_services', values)}
      />
      <CheckboxGroup
        name="training-services"
        label="Training Services"
        options={trainingServicesOptions}
        values={data.training_services}
        onChange={values => onChange('training_services', values)}
      />
      <CheckboxGroup
        name="meal-services"
        label="Meal Services"
        options={mealServicesOptions}
        values={data.meal_services}
        onChange={values => onChange('meal_services', values)}
      />
      <TextAreaField
        id="other-services"
        name="other_services"
        label="Other Services"
        value={data.other_services}
        onChange={value => onChange('other_services', value)}
        rows={3}
      />
    </FormSection>
  );
}
