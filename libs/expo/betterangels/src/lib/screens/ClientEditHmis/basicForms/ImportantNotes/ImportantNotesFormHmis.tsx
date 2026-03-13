import { ControlledInput, Form } from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';
import {
  TImportantNotesFormSchema,
  importantNotesFormEmptyState,
} from './formSchema';

export function ImportantNotesFormHmis() {
  const {
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useFormContext<TImportantNotesFormSchema>();

  return (
    <Form>
      <ControlledInput
        name="importantNotes"
        control={control}
        disabled={isSubmitting}
        placeholder="Enter important notes"
        multiline
        style={{ minHeight: 200 }}
        onDelete={() => {
          setValue(
            'importantNotes',
            importantNotesFormEmptyState.importantNotes
          );
        }}
        errorMessage={errors.importantNotes?.message}
      />
    </Form>
  );
}
