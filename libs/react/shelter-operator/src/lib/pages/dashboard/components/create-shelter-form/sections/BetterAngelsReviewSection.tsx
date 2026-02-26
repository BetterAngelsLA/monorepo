import { memo } from 'react';
import { OVERALL_RATING_OPTIONS } from '../../../formOptions';
import { FormSection } from '../../../../../components/form/FormSection';
import { SelectField } from '../../../../../components/form/SelectField';
import { TextAreaField } from '../../../../../components/form/TextAreaField';
import type { SectionProps } from '../types';

export const BetterAngelsReviewSection = memo(
  function BetterAngelsReviewSection({ data, onChange }: SectionProps) {
    return (
      <FormSection title="Better Angels Review">
        <SelectField
          id="overall-rating"
          name="overallRating"
          label="Overall Rating"
          options={OVERALL_RATING_OPTIONS}
          value={data.overallRating}
          onChange={(value) => onChange('overallRating', value)}
          placeholder="Select a rating"
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
