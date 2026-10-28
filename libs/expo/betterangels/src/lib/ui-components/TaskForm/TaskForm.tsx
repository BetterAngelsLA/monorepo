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

/** What the caller can hand back so the form can mark the offending field. */
export type TTaskFormSubmitResult = {
  field?: keyof TaskFormData;
  message: string;
};

type TProps = {
  initialValues?: Partial<TaskFormData>;
  onCancel: () => void;
  onSubmit: (
    data: TaskFormData,
  ) => Promise<TTaskFormSubmitResult | void> | TTaskFormSubmitResult | void;

  // This function comes from the Smart Container (NoteTasksModal)
  onDelete?: () => Promise<void> | void;

  /** The task's organization, when known: narrows the assignee roster. */
  organizationId?: string | null;

  /** The task's current assignee, so a departed member still renders a name. */
  selectedAssignee?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
};

export function TaskForm(props: TProps) {
  const {
    initialValues,
    onSubmit,
    onDelete,
    onCancel,
    organizationId,
    selectedAssignee,
  } = props;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm<TaskFormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: { ...emptyState, ...initialValues },
    mode: 'onChange',
  });

  const { teams } = useOrgTeams();
  // The roster is only needed once the picker is opened; fetching it with the
  // form meant a full roster request for every task sheet, including the ones
  // where nobody changes the assignee.
  const [rosterRequested, setRosterRequested] = useState(false);
  const {
    assignees,
    loading: assigneesLoading,
    error: assigneesError,
  } = useTaskAssignees({ organizationId, skip: !rosterRequested });
  // Deliberately not memoised with empty deps: `initialValues` can arrive after
  // mount, and a frozen id would drop the task's own (deactivated) team from
  // the item list, leaving the Team field blank.
  const initialTeamId = initialValues?.teamId;

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
      const result = await onSubmit(data);

      // A server-side validation error names the field it belongs to; put it
      // on that field instead of leaving the user with a toast and a guess.
      if (result?.field) {
        methods.setError(result.field, { message: result.message });
      }
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
                    // No "Select team" row in the list: a team is optional, and
                    // clearing it belongs on the field as the same ⊗ the
                    // assignee uses, not as a fake item among the teams.
                    label="Team"
                    modalTitle="Team"
                    maxRadioItems={0}
                    placeholder="Select team"
                    disabled={isSubmitting}
                    items={teamItems}
                    selectedValue={field.value}
                    onChange={(value) => field.onChange(value || '')}
                    onClear={() => field.onChange('')}
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
                  onOpen={() => setRosterRequested(true)}
                  loading={assigneesLoading}
                  loadError={!!assigneesError}
                  selectedFallback={selectedAssignee}
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
