import { BOOLEAN_OPTIONS, EXIT_POLICY_OPTIONS } from '../../../types';
import { CheckboxGroup } from '../components/CheckboxGroup';
import { FormSection } from '../components/FormSection';
import { NumberField } from '../components/NumberField';
import { RadioGroup } from '../components/RadioGroup';
import { SingleFileField } from '../components/SingleFileField';
import { TextAreaField } from '../components/TextAreaField';
import { TextField } from '../components/TextField';
import { TimeRangeField } from '../components/TimeRangeField';
import type { SectionProps } from '../types';

export function PoliciesSection({ data, onChange, errors }: SectionProps) {
  return (
    <FormSection title="Policies">
      <NumberField
        id="max-stay"
        name="max_stay"
        label="Maximum Stay (days)"
        value={data.max_stay}
        onChange={value => onChange('max_stay', value)}
        min={0}
      />
      <TimeRangeField
        id="intake-hours"
        name="intake_hours"
        label="Intake Hours"
        value={data.intake_hours}
        onChange={value => onChange('intake_hours', value)}
        helperText="Add intake time windows"
        error={errors.intake_hours}
      />
      <TimeRangeField
        id="curfew"
        name="curfew"
        label="Curfew"
        value={data.curfew}
        onChange={value => onChange('curfew', value)}
        helperText="Add curfew windows"
        error={errors.curfew}
      />
      <RadioGroup
        name="on-site-security"
        label="On-Site Security"
        options={BOOLEAN_OPTIONS}
        value={data.on_site_security}
        onChange={value => onChange('on_site_security', value)}
        error={errors.on_site_security}
      />
      <RadioGroup
        name="visitors-allowed"
        label="Visitors Allowed"
        options={BOOLEAN_OPTIONS}
        value={data.visitors_allowed}
        onChange={value => onChange('visitors_allowed', value)}
        error={errors.visitors_allowed}
      />
      <CheckboxGroup
        name="exit-policy"
        label="Exit Policy"
        options={EXIT_POLICY_OPTIONS}
        values={data.exit_policy}
        onChange={values => onChange('exit_policy', values)}
        error={errors.exit_policy}
        required
      />
      <TextField
        id="exit-policy-other"
        name="exit_policy_other"
        label="Other Exit Policy"
        value={data.exit_policy_other}
        onChange={value => onChange('exit_policy_other', value)}
      />
      <RadioGroup
        name="emergency-surge"
        label="Emergency Surge Options"
        options={BOOLEAN_OPTIONS}
        value={data.emergency_surge}
        onChange={value => onChange('emergency_surge', value)}
        error={errors.emergency_surge}
      />
      <TextAreaField
        id="other-rules"
        name="other_rules"
        label="Other Rules"
        value={data.other_rules}
        onChange={value => onChange('other_rules', value)}
        rows={3}
      />
      <SingleFileField
        id="agreement-form"
        name="agreement_form"
        label="Agreement Form"
        value={data.agreement_form}
        onChange={file => onChange('agreement_form', file)}
      />
    </FormSection>
  );
}
