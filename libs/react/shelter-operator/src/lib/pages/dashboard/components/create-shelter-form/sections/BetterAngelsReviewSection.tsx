import { memo } from 'react';
import { OVERALL_RATING_OPTIONS } from '../../../formOptions';
import {
  Dropdown,
  DropdownOption,
} from '../../../../../components/base-ui/dropdown';
import { FormSection } from '../../../../../components/form/FormSection';
import { TextAreaField } from '../../../../../components/form/TextAreaField';
import type { SectionProps } from '../types';

export const BetterAngelsReviewSection = memo(
  function BetterAngelsReviewSection({ data, onChange }: SectionProps) {
    return (
      <FormSection title="Better Angels Review">
        <Dropdown
          label="Overall Rating"
          placeholder="Select a rating"
          options={OVERALL_RATING_OPTIONS.filter((o) => o.value !== null).map(
            (o) => ({ label: o.label, value: o.value as number })
          )}
          value={
            data.overallRating !== null
              ? {
                  label: String(data.overallRating),
                  value: data.overallRating,
                }
              : null
          }
          onChange={(selected) => {
            const option = selected as DropdownOption | null;
            onChange('overallRating', option ? (option.value as number) : null);
          }}
        />
        <TextAreaField
          id="subjective-review"
          name="subjectiveReview"
          label="Subjective Review"
          value={data.subjectiveReview}
          onChange={(value) => onChange('subjectiveReview', value)}
          rows={4}
        />
      </FormSection>
    );
  }
);
