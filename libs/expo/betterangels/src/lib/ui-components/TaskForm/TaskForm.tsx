import { zodResolver } from '@hookform/resolvers/zod';
import { Colors } from '@monorepo/expo/shared/static';
import {
  ControlledInput,
  Form,
  SingleSelect,
  TextButton,
} from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import {
  Controller,
  FormProvider,
  SubmitHandler,
  useForm,
} from 'react-hook-form'; // Added FormProvider
import { View } from 'react-native';
import { z } from 'zod';
import { SelahTeamEnum, TaskStatusEnum } from '../../apollo';
import { enumDisplaySelahTeam, enumDisplayTaskStatus } from '../../static';

const FormSchema = z.object({
  summary: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  team: z.nativeEnum(SelahTeamEnum).optional().or(z.literal('')),
  status: z.nativeEnum(TaskStatusEnum).optional().or(z.literal('')),
});

export type TaskFormData = z.infer<typeof FormSchema>;

const emptyState: TaskFormData = {
  summary: '',
  description: '',
  team: '' as any,
  status: '' as any,
};

type TProps = {
  initialValues?: Partial<TaskFormData>;
  onCancel: () => void;
  onSubmit: (data: TaskFormData) => Promise<void>;
  onDelete?: () => void;
};

export function TaskForm(props: TProps) {
  const { initialValues, onSubmit, onDelete, onCancel } = props;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize the form.
  // We use defaultValues directly because the Modal mounts a new instance of this
  // component every time it opens. This avoids the need for a useEffect reset.
  const methods = useForm<TaskFormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: { ...emptyState, ...initialValues },
    mode: 'onChange', // Validates as you type (does not auto-submit)
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = methods;

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
    // CRITICAL FIX: FormProvider isolates this form from any parent form contexts
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
              name="team"
              control={control}
              render={({ field }) => (
                <SingleSelect
                  allowSelectNone={true}
                  label="Team"
                  placeholder="Select team"
                  disabled={isSubmitting}
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

        {onDelete && (
          <View style={{ marginTop: 24, paddingHorizontal: 16 }}>
            <TextButton
              title="Delete Task"
              color={Colors.ERROR}
              onPress={onDelete}
              disabled={isSubmitting}
              accessibilityHint="Deletes this task"
            />
          </View>
        )}
      </Form.Page>
    </FormProvider>
  );
}
