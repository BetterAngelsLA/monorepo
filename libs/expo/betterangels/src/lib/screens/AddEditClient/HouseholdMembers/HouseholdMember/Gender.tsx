import { Control, useFormContext } from 'react-hook-form';
import {
  CreateClientProfileInput,
  GenderEnum,
  UpdateClientProfileInput,
} from '../../../../apollo';
import { GenderPicker } from '../../../../ui-components';

export default function Gender({ index }: { index: number }) {
  const { setValue, watch, control } = useFormContext<
    UpdateClientProfileInput | CreateClientProfileInput
  >();
  const householdMembers = watch('householdMembers') || [];

  return (
    <GenderPicker
      title="Gender"
      value={householdMembers.length > 0 ? householdMembers[index]?.gender : ''}
      onPress={(enumValue) => {
        const updatedHouseholdMembers = [...householdMembers];
        updatedHouseholdMembers[index] = {
          ...updatedHouseholdMembers[index],
          gender: enumValue as GenderEnum,
        };
        setValue('householdMembers', updatedHouseholdMembers);
      }}
      otherName={`householdMembers[${index}].genderOther`}
      control={control as Control<CreateClientProfileInput>}
    />
  );
}
