import { useFormContext } from 'react-hook-form';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
} from '../../../../apollo';
import { DateOfBirthPicker } from '../../../../ui-components';

export default function DateOfBirth({ index }: { index: number }) {
  const { setValue, watch } = useFormContext<
    UpdateClientProfileInput | CreateClientProfileInput
  >();
  const householdMembers = watch('householdMembers') || [];

  return (
    <DateOfBirthPicker
      setValue={(date) => {
        const updatedHouseholdMembers = [...householdMembers];
        updatedHouseholdMembers[index] = {
          ...updatedHouseholdMembers[index],
          dateOfBirth: date,
        };
        setValue('householdMembers', updatedHouseholdMembers);
      }}
      value={householdMembers[index].dateOfBirth}
    />
  );
}
