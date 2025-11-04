import {
  DEMOGRAPHICS_OPTIONS,
  SPECIAL_SITUATION_OPTIONS,
  SHELTER_TYPES_OPTIONS,
} from '../../../types';
import { CheckboxGroup } from '../components/CheckboxGroup';
import { FormSection } from '../components/FormSection';
import { TextAreaField } from '../components/TextAreaField';
import { TextField } from '../components/TextField';
import type { SectionProps } from '../types';
import { mapToCheckboxOptions } from '../utils/formUtils';

const demographicsOptions = mapToCheckboxOptions(DEMOGRAPHICS_OPTIONS);
const specialSituationOptions = mapToCheckboxOptions(SPECIAL_SITUATION_OPTIONS);
const shelterTypeOptions = mapToCheckboxOptions(SHELTER_TYPES_OPTIONS);

export function SummaryInformationSection({ data, onChange }: SectionProps) {
  return (
    <FormSection title="Summary Information">
      <CheckboxGroup
        name="demographics"
        label="Demographics Served"
        options={demographicsOptions}
        values={data.demographics}
        onChange={values => onChange('demographics', values)}
      />
      <TextField
        id="demographics-other"
        name="demographics_other"
        label="Other Demographics"
        value={data.demographics_other}
        onChange={value => onChange('demographics_other', value)}
      />
      <CheckboxGroup
        name="special-situation"
        label="Special Situation Restrictions"
        options={specialSituationOptions}
        values={data.special_situation_restrictions}
        onChange={values => onChange('special_situation_restrictions', values)}
      />
      <CheckboxGroup
        name="shelter-types"
        label="Shelter Types"
        options={shelterTypeOptions}
        values={data.shelter_types}
        onChange={values => onChange('shelter_types', values)}
      />
      <TextField
        id="shelter-types-other"
        name="shelter_types_other"
        label="Other Shelter Types"
        value={data.shelter_types_other}
        onChange={value => onChange('shelter_types_other', value)}
      />
      <TextAreaField
        id="shelter-description"
        name="description"
        label="Description"
        value={data.description}
        onChange={value => onChange('description', value)}
        rows={4}
      />
    </FormSection>
  );
}
