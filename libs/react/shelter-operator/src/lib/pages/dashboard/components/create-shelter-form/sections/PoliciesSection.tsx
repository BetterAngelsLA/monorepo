import { ExitPolicyChoices } from '@monorepo/react/shelter';
import { memo } from 'react';
import { Dropdown } from '../../../../../components/base-ui/dropdown/Dropdown';
import { Input } from '../../../../../components/base-ui/input/Input';
import { FormSection } from '../../../../../components/form/FormSection';
import { EXIT_POLICY_OPTIONS } from '../../../formOptions';
import type { SectionProps } from '../types';

const DROPDOWN_OTHER_VALUE = '__dropdown_other__';

const selectedOptions = <T extends string>(
  options: { value: T; label: string }[],
  values: T[]
) => options.filter((option) => values.includes(option.value));

const toValues = <T extends string>(
  values: Array<{ value: string; label: string }> | null,
  mappedOtherValue?: T
) => {
  const next = new Set<T>();

  (values ?? []).forEach((option) => {
    if (option.value === DROPDOWN_OTHER_VALUE) {
      if (mappedOtherValue) {
        next.add(mappedOtherValue);
      }
      return;
    }
    next.add(option.value as T);
  });

  return Array.from(next);
};

const BOOLEAN_DROPDOWN_OPTIONS = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
] as const;

const toBooleanSelection = (value: boolean | null) => {
  if (value === true) return { value: 'yes', label: 'Yes' };
  if (value === false) return { value: 'no', label: 'No' };
  return { value: 'unknown', label: 'Unknown' };
};

const fromBooleanSelection = (value: string | null): boolean | null => {
  if (value === 'yes') return true;
  if (value === 'no') return false;
  return null;
};

export const PoliciesSection = memo(function PoliciesSection({
  data,
  onChange,
  errors,
  isTouched,
}: SectionProps) {
  return (
    <FormSection
      title="Policies"
      className="rounded-none border-0 bg-transparent p-0"
      contentClassName="space-y-6 py-6"
      titleClassName=""
    >
      <Input
        id="max-stay"
        label="Maximum Stay (days)"
        type="number"
        min={0}
        placeholder="Enter number of days"
        value={data.maxStay ?? ''}
        onChange={(event) => {
          const nextValue = event.target.value;
          onChange(
            'maxStay',
            nextValue === '' ? null : Number.parseInt(nextValue, 10)
          );
        }}
      />

      <Input
        id="curfew"
        label="Curfew"
        type="time"
        placeholder="Select time"
        value={data.curfew}
        onChange={(event) => onChange('curfew', event.target.value)}
        error={errors.curfew}
        isTouched={isTouched}
      />

      <Dropdown
        label="On-Site Security"
        placeholder="Please select"
        options={BOOLEAN_DROPDOWN_OPTIONS.map((option) => ({
          label: option.label,
          value: option.value,
        }))}
        value={toBooleanSelection(data.onSiteSecurity)}
        onChange={(value) =>
          onChange('onSiteSecurity', fromBooleanSelection(value?.value ?? null))
        }
        error={errors.onSiteSecurity}
      />

      <Dropdown
        label="Visitors Allowed"
        placeholder="Please select"
        options={BOOLEAN_DROPDOWN_OPTIONS.map((option) => ({
          label: option.label,
          value: option.value,
        }))}
        value={toBooleanSelection(data.visitorsAllowed)}
        onChange={(value) =>
          onChange(
            'visitorsAllowed',
            fromBooleanSelection(value?.value ?? null)
          )
        }
        error={errors.visitorsAllowed}
      />

      <Dropdown
        label="Exit Policy"
        options={EXIT_POLICY_OPTIONS}
        placeholder="Please select"
        value={selectedOptions(EXIT_POLICY_OPTIONS, data.exitPolicy)}
        onChange={(values) => {
          const nextValues = toValues<ExitPolicyChoices>(
            values,
            ExitPolicyChoices.Other
          );
          onChange('exitPolicy', nextValues);
          if (
            !nextValues.includes(ExitPolicyChoices.Other) &&
            data.exitPolicyOther
          ) {
            onChange('exitPolicyOther', '');
          }
        }}
        onOtherTextChange={(text) => onChange('exitPolicyOther', text)}
        isMulti
      />

      <Dropdown
        label="Emergency Surge Options"
        placeholder="Please select"
        options={BOOLEAN_DROPDOWN_OPTIONS.map((option) => ({
          label: option.label,
          value: option.value,
        }))}
        value={toBooleanSelection(data.emergencySurge)}
        onChange={(value) =>
          onChange('emergencySurge', fromBooleanSelection(value?.value ?? null))
        }
        error={errors.emergencySurge}
      />

      <Input
        id="other-rules"
        variant="paragraph"
        label="Other Rules"
        placeholder="Describe here"
        value={data.otherRules}
        onChange={(event) => onChange('otherRules', event.target.value)}
        isTouched={isTouched}
      />
    </FormSection>
  );
});
