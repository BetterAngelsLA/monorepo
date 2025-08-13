import { zodResolver } from '@hookform/resolvers/zod';
import {
  ControlledInput,
  Form,
  SingleSelect,
} from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { TaskType, extractOperationErrors } from '../../apollo';
import { applyOperationFieldErrors } from '../../errors';
import { useSnackbar } from '../../hooks';
import { enumDisplaySelahTeam, enumDisplayTaskStatus } from '../../static';
import { useCreateTaskMutation } from './__generated__/createTask.generated';
import { FormSchema, TFormSchema, emptyState } from './formSchema';

type TProps = {
  clientProfileId?: string;
  onCancel?: () => void;
  onSuccess?: (id: string) => void;
};

export function TaskForm(props: TProps) {
  const { clientProfileId, onSuccess, onCancel } = props;

  const [disabled, setDisabled] = useState(false);
  const { showSnackbar } = useSnackbar();
  const [createTaskMutation] = useCreateTaskMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
    resetField,
    setError,
    setValue,
  } = useForm<TFormSchema>({
    resolver: zodResolver(FormSchema),
    defaultValues: emptyState,
  });

  const onSubmit: SubmitHandler<TFormSchema> = async (
    formData: TFormSchema
  ) => {
    try {
      setDisabled(true);

      const { summary, description, team, status } = formData;

      const response = await createTaskMutation({
        variables: {
          data: {
            summary,
            description,
            status,
            team: team || undefined,
            clientProfile: clientProfileId,
          },
        },
        errorPolicy: 'all',
      });

      const { validationErrors, errorMessage } = extractOperationErrors({
        response,
        queryKey: 'createTask',
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

      const newTask = response.data?.createTask;

      if (!newTask) {
        throw new Error('mutation failed');
      }

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
