import { OVERALL_RATING_OPTIONS } from '../../../types';
import { FormSection } from '../../../../../components/form/FormSection';
import { SelectField } from '../../../../../components/form/SelectField';
import { TextAreaField } from '../../../../../components/form/TextAreaField';
import type { SectionProps } from '../types';

export function BetterAngelsReviewSection({ data, onChange }: SectionProps) {
  return (
    <FormSection title="Better Angels Review">
      <SelectField
        id="overall-rating"
        name="overall_rating"
        label="Overall Rating"
        options={OVERALL_RATING_OPTIONS}
        value={data.overall_rating}
        onChange={value => onChange('overall_rating', value)}
        placeholder="Select a rating"
      />
      <TextAreaField
        id="subjective-review"
        name="subjective_review"
        label="Subjective Review"
        value={data.subjective_review}
        onChange={value => onChange('subjective_review', value)}
        rows={4}
      />
    </FormSection>
  );
}
