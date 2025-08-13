import { zodResolver } from '@hookform/resolvers/zod';
import {
  ControlledInput,
  Form,
  SingleSelect,
} from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { enumDisplaySelahTeam, enumDisplayTaskStatus } from '../../static';
import { FormSchema, TFormSchema, emptyState } from './formSchema';

type TProps = {
  taskId?: string;
};

export function TaskForm(props: TProps) {
  const { taskId } = props;

  const isEditMode = !!taskId;

  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid: formIsValid },
    resetField,
    setError,
    setValue,
    clearErrors,
  } = useForm<TFormSchema>({
    resolver: zodResolver(FormSchema),
    defaultValues: emptyState,
  });

  const onSubmit: SubmitHandler<TFormSchema> = async (
    formData: TFormSchema
  ) => {
    console.log();
    console.log('| -------------  SUBMIT formData  ------------- |');
    console.log(formData);
    console.log();
  };

  return (
    <Form.Page
      actionProps={{
        onSubmit: handleSubmit(onSubmit),
        onLeftBtnClick: router.back,
        disabled: isLoading,
      }}
    >
      <Form>
        <Form.Fieldset>
          <ControlledInput
            control={control}
            disabled={isLoading}
            label={'Title'}
            name={'title'}
            placeholder={'Enter title'}
            onDelete={() => {
              setValue('title', emptyState.title);
            }}
            errorMessage={errors.title?.message}
          />

          <Controller
            name="team"
            control={control}
            render={({ field }) => (
              <SingleSelect
                disabled={isLoading}
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
            disabled={isLoading}
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
                disabled={isLoading}
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

      {/* {isEditMode && ()} */}
    </Form.Page>
  );
}
