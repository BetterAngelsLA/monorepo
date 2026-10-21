import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import type { UseFormSetError } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';
import { Dropdown } from '../../../../base-ui/dropdown';
import { RichTextEditor } from '../../../../base-ui/richTextEditor';
import { Switch } from '../../../../base-ui/switch';
import { Form } from '../../../../form/Form';
import { RATING_OPTIONS } from './constants';
import {
  defaultFormValues,
  formSchema,
  type ReviewFormData,
} from './formSchema';

type TProps = {
  values?: Partial<ReviewFormData>;
  onSubmit: (
    data: ReviewFormData,
    setError: UseFormSetError<ReviewFormData>,
  ) => void;
  isViewMode?: boolean;
  onEditClick?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
};

export function ShelterReviewForm(props: TProps) {
  const {
    values,
    onSubmit,
    isViewMode = false,
    onEditClick,
    onCancel,
    disabled = false,
  } = props;

  const initialValues = useMemo(
    () => ({ ...defaultFormValues, ...values }),
    [values],
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
  } = useForm<ReviewFormData>({
    resolver: zodResolver(formSchema),
    values: initialValues,
    mode: 'onBlur',
  });

  function handleCancel() {
    reset(initialValues);
    onCancel?.();
  }

  return (
    <Form className="flex-1 gap-4">
      <Form.Header
        title="Internal Review - BA private"
        onEditClick={isViewMode ? onEditClick : undefined}
        className="pl-5 my-6"
        size="sm"
      />

      <Form.Content>
        <Form.Block columns={2}>
          <Controller
            name="overallRating"
            control={control}
            render={({ field }) => (
              <Dropdown
                label="Overall Rating"
                placeholder="Select a rating"
                options={RATING_OPTIONS}
                value={
                  field.value === null
                    ? null
                    : (RATING_OPTIONS.find((o) => o.value === field.value) ??
                      null)
                }
                onChange={(option) => {
                  if (option && !Array.isArray(option)) {
                    field.onChange(option.value);
                  } else {
                    field.onChange(null);
                  }
                }}
                disabled={disabled}
                isViewMode={isViewMode}
                error={errors.overallRating?.message}
              />
            )}
          />

          <Controller
            name="declinedBaVisit"
            control={control}
            render={({ field }) => (
              <Switch
                label="Declined BA Visit"
                value={field.value}
                onChange={field.onChange}
                disabled={disabled}
                isViewMode={isViewMode}
              />
            )}
          />
        </Form.Block>

        <Controller
          name="subjectiveReview"
          control={control}
          render={({ field }) => (
            <RichTextEditor
              label="Subjective Review"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              disabled={disabled}
              isViewMode={isViewMode}
              error={errors.subjectiveReview?.message}
            />
          )}
        />

        {!isViewMode && (
          <Form.Actions
            onPrimaryClick={handleSubmit((data) => onSubmit(data, setError))}
            onSecondaryClick={handleCancel}
            primaryDisabled={disabled}
            secondaryDisabled={disabled}
          />
        )}
      </Form.Content>
    </Form>
  );
}
