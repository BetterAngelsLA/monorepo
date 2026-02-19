import { ExitPolicyChoices } from '@monorepo/react/shelter';
import { memo } from 'react';
import { CheckboxGroup } from '../../../../../components/form/CheckboxGroup';
import { FormSection } from '../../../../../components/form/FormSection';
import { NumberField } from '../../../../../components/form/NumberField';
import { RadioGroup } from '../../../../../components/form/RadioGroup';
import { TextAreaField } from '../../../../../components/form/TextAreaField';
import { TextField } from '../../../../../components/form/TextField';
import { BOOLEAN_OPTIONS, EXIT_POLICY_OPTIONS } from '../../../formOptions';
import type { SectionProps } from '../types';

export const PoliciesSection = memo(function PoliciesSection({
  data,
  onChange,
  errors,
}: SectionProps) {
  return (
    <FormSection title="Policies">
      <NumberField
        id="max-stay"
        name="maxStay"
        label="Maximum Stay (days)"
        value={data.maxStay}
        onChange={(value) => onChange('maxStay', value)}
        min={0}
      />
      <TextField
        id="curfew"
        name="curfew"
        label="Curfew"
        type="time"
        value={data.curfew}
        onChange={(value) => onChange('curfew', value)}
        error={errors.curfew}
      />
      <RadioGroup
        name="on-site-security"
        label="On-Site Security"
        options={BOOLEAN_OPTIONS}
        value={data.onSiteSecurity}
        onChange={(value) => onChange('onSiteSecurity', value)}
        error={errors.onSiteSecurity}
      />
      <RadioGroup
        name="visitors-allowed"
        label="Visitors Allowed"
        options={BOOLEAN_OPTIONS}
        value={data.visitorsAllowed}
        onChange={(value) => onChange('visitorsAllowed', value)}
        error={errors.visitorsAllowed}
      />
      <CheckboxGroup
        name="exit-policy"
        label="Exit Policy"
        options={EXIT_POLICY_OPTIONS}
        values={data.exitPolicy}
        onChange={(values) => {
          onChange('exitPolicy', values);
          if (
            !values.includes(ExitPolicyChoices.Other) &&
            data.exitPolicyOther
          ) {
            onChange('exitPolicyOther', '');
          }
        }}
      />
      {data.exitPolicy.includes(ExitPolicyChoices.Other) ? (
        <TextField
          id="exit-policy-other"
          name="exitPolicyOther"
          label="Other Exit Policy"
          value={data.exitPolicyOther}
          onChange={(value) => onChange('exitPolicyOther', value)}
        />
      ) : null}
      <RadioGroup
        name="emergency-surge"
        label="Emergency Surge Options"
        options={BOOLEAN_OPTIONS}
        value={data.emergencySurge}
        onChange={(value) => onChange('emergencySurge', value)}
        error={errors.emergencySurge}
      />
      <TextAreaField
        id="other-rules"
        name="otherRules"
        label="Other Rules"
        value={data.otherRules}
        onChange={(value) => onChange('otherRules', value)}
        rows={3}
      />
    </FormSection>
  );
});
