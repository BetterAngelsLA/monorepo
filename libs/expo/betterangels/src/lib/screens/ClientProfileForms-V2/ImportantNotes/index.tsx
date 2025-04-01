import { ControlledInput } from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';
import { UpdateClientProfileInput } from '../../../apollo';

export default function ImportantNotes() {
  const { control, setValue } = useFormContext<UpdateClientProfileInput>();

  return (
    <ControlledInput
      name="importantNotes"
      placeholder="Enter important notes"
      control={control}
      multiline
      style={{ minHeight: 200 }}
      onDelete={() => setValue('importantNotes', '')}
    />
  );
}
