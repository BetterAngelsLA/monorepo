import { ControlledInput, Form } from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';
import {
  THmisProgramNoteFormSchema,
  hmisProgramNoteFormEmptyState,
} from './formSchema';

export function HmisProgramNoteForm() {
  const {
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useFormContext<THmisProgramNoteFormSchema>();

  return (
    <Form>
      <Form.Fieldset>
        <ControlledInput
          name="title"
          required
          control={control}
          disabled={isSubmitting}
          label="Purpose"
          placeholder="Enter purpose"
          onDelete={() => {
            setValue('title', hmisProgramNoteFormEmptyState.title);
          }}
          errorMessage={errors.title?.message}
        />
      </Form.Fieldset>
    </Form>
  );
}
