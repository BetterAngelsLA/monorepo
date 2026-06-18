import { useQuery } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ControlledInput,
  Form,
  SingleSelect,
} from '@monorepo/expo/shared/ui-components';
import { useEffect, useState } from 'react';
import {
  Controller,
  FormProvider,
  SubmitHandler,
  useForm,
} from 'react-hook-form';
import { enumDisplayTaskStatus } from '../../static';
import { TeamsDocument, TeamsQuery } from '../UserPreferences/UserTeamPreference/__generated__/teams.generated';

import DeleteTask from './DeleteTask';
import { FormSchema, TFormSchema, emptyState } from './formSchema';

export type TaskFormData = TFormSchema;

type TProps = {
  initialValues?: Partial<TaskFormData>;
  onCancel: () => void;
  onSubmit: (data: TaskFormData) => Promise<void> | void;

  // This function comes from the Smart Container (NoteTasksModal)
  onDelete?: () => Promise<void> | void;
};

export function TaskForm(props: TProps) {
  const { initialValues, onSubmit, onDelete, onCancel } = props;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm<TaskFormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: { ...emptyState, ...initialValues },
    mode: 'onChange',
  });

  const { data } = useQuery<TeamsQuery>(TeamsDocument);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = methods;

  useEffect(() => {
    if (initialValues) {
      reset({ ...emptyState, ...initialValues });
    }
  }, [initialValues, reset]);

  const handleFormSubmit: SubmitHandler<TaskFormData> = async (data) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <Form.Page
        actionProps={{
          onSubmit: handleSubmit(handleFormSubmit),
          onLeftBtnClick: onCancel,
          disabled: isSubmitting,
        }}
      >
        <Form>
          <Form.Fieldset>
            <ControlledInput
              required
              control={control}
              label="Title"
              name="summary"
              disabled={isSubmitting}
              placeholder="Enter title"
              onDelete={() => setValue('summary', emptyState.summary)}
              errorMessage={errors.summary?.message}
            />

            <Controller
              name="teamId"
              control={control}
              render={({ field }) => (
                <SingleSelect
                  allowSelectNone={true}
                  label="Team"
                  placeholder="Select team"
                  disabled={isSubmitting}
                  items={(data?.teams ?? []).map(
                    (t) => ({ value: t.id, displayValue: t.name })
                  )}
                  selectedValue={field.value}
                  onChange={(value) => field.onChange(value || '')}
                  error={errors.teamId?.message}
                />
              )}
            />

            <ControlledInput
              multiline
              numberOfLines={4}
              control={control}
              label="Description"
              name="description"
              disabled={isSubmitting}
              placeholder="Enter description"
              inputStyle={{ minHeight: 150 }}
              onDelete={() => setValue('description', emptyState.description)}
              errorMessage={errors.description?.message}
            />

            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <SingleSelect
                  label="Status"
                  placeholder="Select status"
                  disabled={isSubmitting}
                  maxRadioItems={0}
                  items={Object.entries(enumDisplayTaskStatus).map(
                    ([value, displayValue]) => ({ value, displayValue })
                  )}
                  selectedValue={field.value}
                  onChange={(value) => field.onChange(value || '')}
                  error={errors.status?.message}
                />
              )}
            />
          </Form.Fieldset>
        </Form>

        {/* Simply render DeleteTask if an onDelete handler exists */}
        {onDelete && <DeleteTask onDelete={onDelete} />}
      </Form.Page>
    </FormProvider>
  );
}
