import { zodResolver } from '@hookform/resolvers/zod';
import {
  ControlledInput,
  Form,
  SingleSelect,
} from '@monorepo/expo/shared/ui-components';
import { useEffect, useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import {
  SelahTeamEnum,
  TaskType,
  UpdateTaskInput,
  extractOperationErrors,
} from '../../apollo';
import { applyOperationFieldErrors } from '../../errors';
import { useSnackbar } from '../../hooks';
import { enumDisplaySelahTeam, enumDisplayTaskStatus } from '../../static';
import { useCreateTaskMutation } from './__generated__/createTask.generated';
import { useUpdateTaskMutation } from './__generated__/updateTask.generated';
import { FormSchema, TFormSchema, emptyState } from './formSchema';

type TProps = {
  clientProfileId?: string;
  team?: SelahTeamEnum | null;
  noteId?: string;
  onCancel?: () => void;
  onSuccess?: (taskId: string) => void;
  task?: UpdateTaskInput | null;
};

export function TaskForm(props: TProps) {
  const { clientProfileId, team, onSuccess, onCancel, noteId, task } = props;

  const [disabled, setDisabled] = useState(false);
  const { showSnackbar } = useSnackbar();
  const [createTaskMutation] = useCreateTaskMutation();
  const [updateTaskMutation] = useUpdateTaskMutation();
  console.log(clientProfileId);
  const {
    control,
    handleSubmit,
    formState: { errors },
    resetField,
    reset: resetForm,
    setError,
    setValue,
  } = useForm<TFormSchema>({
    resolver: zodResolver(FormSchema),
    defaultValues: { ...emptyState, team: team || '' },
  });

  const onSubmit: SubmitHandler<TFormSchema> = async (
    formData: TFormSchema
  ) => {
    try {
      setDisabled(true);

      const { summary, description, team, status } = formData;

      const response = task
        ? await updateTaskMutation({
            variables: {
              data: {
                id: task.id,
                summary,
                description,
                status,
                team: team || null,
              },
            },
            errorPolicy: 'all',
          })
        : await createTaskMutation({
            variables: {
              data: {
                summary,
                description,
                status,
                team: team || null,
                clientProfile: clientProfileId,
                note: noteId || null,
              },
            },
            errorPolicy: 'all',
          });

      const { validationErrors, errorMessage } = extractOperationErrors({
        response,
        queryKey: task ? 'updateTask' : 'createTask',
        fields: Object.keys(FormSchema.shape),
        resultTypename: 'TaskType',
      });

      // if has field validation errors, apply and return
      if (validationErrors?.length) {
        applyOperationFieldErrors(validationErrors, setError);

        return;
      }

      if (errorMessage) {
        throw new Error(errorMessage);
      }

      let newTask;

      if (response.data && 'updateTask' in response.data) {
        newTask = response.data.updateTask;
      } else {
        newTask = response.data?.createTask;
      }

      if (!newTask) {
        throw new Error('mutation failed');
      }

      resetForm();
      onSuccess?.((newTask as TaskType).id);
    } catch (error) {
      console.error('Task mutation error:', error);

      showSnackbar({
        message: 'Something went wrong. Please try again.',
        type: 'error',
      });
    } finally {
      setDisabled(false);
    }
  };

  useEffect(() => {
    if (!task) return;

    resetForm({
      ...emptyState,
      summary: task.summary || undefined,
      team: task.team || undefined,
      description: task.description || '',
      status: task.status || undefined,
    });
  }, [task]);

  return (
    <Form.Page
      actionProps={{
        onSubmit: handleSubmit(onSubmit),
        onLeftBtnClick: onCancel,
        disabled,
      }}
    >
      <Form>
        <Form.Fieldset>
          <ControlledInput
            control={control}
            disabled={disabled}
            label={'Title'}
            name={'summary'}
            placeholder={'Enter title'}
            onDelete={() => {
              setValue('summary', emptyState.summary);
            }}
            errorMessage={errors.summary?.message}
          />

          <Controller
            name="team"
            control={control}
            render={({ field }) => (
              <SingleSelect
                disabled={disabled}
                allowSelectNone={true}
                label="Team"
                placeholder="Select team"
                items={Object.entries(enumDisplaySelahTeam).map(
                  ([value, displayValue]) => ({ value, displayValue })
                )}
                selectedValue={field.value}
                onChange={(value) => field.onChange(value || '')}
                error={errors.team?.message}
              />
            )}
          />

          <ControlledInput
            multiline
            numberOfLines={4}
            control={control}
            disabled={disabled}
            label={'Description'}
            name={'description'}
            placeholder={'Enter description'}
            inputStyle={{ minHeight: 150 }}
            onDelete={() => {
              resetField('description');
            }}
            errorMessage={errors.description?.message}
          />

          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <SingleSelect
                disabled={disabled}
                label="Status"
                placeholder="Select status"
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
    </Form.Page>
  );
}
