import { zodResolver } from '@hookform/resolvers/zod';
import {
  ControlledInput,
  Form,
  SingleSelect,
} from '@monorepo/expo/shared/ui-components';
import { formatTeamDisplayName } from '@monorepo/ba-platform';
import { useEffect, useMemo, useState } from 'react';
import {
  Controller,
  FormProvider,
  SubmitHandler,
  useForm,
} from 'react-hook-form';
import { useOrgTeams, useTaskAssignees } from '../../hooks';
import { enumDisplayTaskStatus } from '../../static';
import { AssigneeSelect } from '../AssigneeSelect';

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

  const { teams } = useOrgTeams();
  const { assignees } = useTaskAssignees();
  const initialTeamId = useMemo(() => initialValues?.teamId, []);

  const teamItems = useMemo(
    () =>
      teams
        .filter((t) => t.isActive || t.id === initialTeamId)
        .map((t) => ({
          value: t.id,
          displayValue: formatTeamDisplayName(t),
        })),
    [teams, initialTeamId],
  );

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

            {/*
              Skip the field entirely when the org has no teams: `SingleSelect`
              renders only a label for an empty item list, which reads as a
              control that failed to load and breaks the sheet's field rhythm.
              A team already on the task stays listed even if it was deactivated.
            */}
            {teamItems.length > 0 && (
              <Controller
                name="teamId"
                control={control}
                render={({ field }) => (
                  <SingleSelect
                    allowSelectNone={true}
                    label="Team"
                    modalTitle="Team"
                    maxRadioItems={0}
                    placeholder="Select team"
                    disabled={isSubmitting}
                    items={teamItems}
                    selectedValue={field.value}
                    onChange={(value) => field.onChange(value || '')}
                    error={errors.teamId?.message}
                  />
                )}
              />
            )}

            <Controller
              name="assigneeId"
              control={control}
              render={({ field }) => (
                <AssigneeSelect
                  label="Assigned To"
                  placeholder="Select assignee"
                  disabled={isSubmitting}
                  items={assignees}
                  selectedValue={field.value}
                  onChange={(value) => field.onChange(value || '')}
                  error={errors.assigneeId?.message}
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
                  modalTitle="Status"
                  placeholder="Select status"
                  disabled={isSubmitting}
                  maxRadioItems={0}
                  items={Object.entries(enumDisplayTaskStatus).map(
                    ([value, displayValue]) => ({ value, displayValue }),
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
