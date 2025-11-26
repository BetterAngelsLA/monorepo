import { zodResolver } from '@hookform/resolvers/zod';
import { Colors } from '@monorepo/expo/shared/static';
import {
  ControlledInput,
  Form,
  SingleSelect,
  TextButton,
} from '@monorepo/expo/shared/ui-components';
import { useEffect, useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { z } from 'zod'; // Ensure zod is installed
import { enumDisplaySelahTeam, enumDisplayTaskStatus } from '../../static';
// Remove external formSchema import to prevent path errors
// import { FormSchema, TFormSchema, emptyState } from './formSchema';

// --- INLINE SCHEMA DEFINITION (Dependencies Removed) ---
import { SelahTeamEnum, TaskStatusEnum } from '../../apollo';

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
// -------------------------------------------------------

type TProps = {
  initialValues?: Partial<TaskFormData>;
  onCancel: () => void;
  // Parent injects the logic (Live vs Draft)
  onSubmit: (data: TaskFormData) => Promise<void>;
  onDelete?: () => void;
};

export function TaskForm(props: TProps) {
  const { initialValues, onSubmit, onDelete, onCancel } = props;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<TaskFormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: { ...emptyState, ...initialValues },
  });

  const handleFormSubmit: SubmitHandler<TaskFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      reset(emptyState);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (initialValues) {
      reset({ ...emptyState, ...initialValues });
    }
  }, [initialValues, reset]);

  return (
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

      {/* Replaced DeleteTask component with simple TextButton to avoid crashes */}
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
  );
}
