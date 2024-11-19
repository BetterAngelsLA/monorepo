import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  Input,
  Picker,
  TextBold,
  TextButton,
} from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';
import { View } from 'react-native';
import {
  CreateClientProfileInput,
  RelationshipTypeEnum,
  UpdateClientProfileInput,
} from '../../../../apollo';
import { clientHouseholdMemberEnumDisplay } from '../../../../static/enumDisplayMapping';
import DateOfBirth from './DateOfBirth';
import Gender from './Gender';

interface IHouseholdMemberProps {
  index: number;
  remove: (index: number) => void;
}

export default function HouseholdMember(props: IHouseholdMemberProps) {
  const { index, remove } = props;
  const { control, setValue, watch } = useFormContext<
    UpdateClientProfileInput | CreateClientProfileInput
  >();

  const relationship = watch(`householdMembers.${index}.relationshipToClient`);

  const householdMembers = watch('householdMembers') || [];

  const handleRemove = () => {
    remove(index);
  };

  const handleReset = () => {
    setValue(`householdMembers.${index}.relationshipToClient`, null);
    setValue(`householdMembers.${index}.name`, null);
    setValue(`householdMembers.${index}.gender`, null);
    setValue(`householdMembers.${index}.genderOther`, null);
    setValue(`householdMembers.${index}.dateOfBirth`, null);
    setValue(`householdMembers.${index}.relationshipToClientOther`, null);
  };

  if (!relationship) {
    return (
      <Picker
        items={Object.entries(clientHouseholdMemberEnumDisplay).map(
          ([enumValue, displayValue]) => ({
            label: displayValue,
            value: enumValue,
          })
        )}
        setSelectedValue={(e) =>
          setValue(
            `householdMembers.${index}.relationshipToClient`,
            e as RelationshipTypeEnum
          )
        }
        placeholder="Select Relationship"
        value={relationship}
      />
    );
  }

  return (
    <View
      style={{
        gap: Spacings.sm,
        borderRadius: Radiuses.xs,
        borderColor: Colors.NEUTRAL_LIGHT,
        borderWidth: 1,
        backgroundColor: Colors.WHITE,
        paddingTop: Spacings.md,
        paddingBottom: Spacings.lg,
        paddingHorizontal: Spacings.sm,
      }}
    >
      <TextBold size="lg">
        {clientHouseholdMemberEnumDisplay[relationship]}
      </TextBold>
      {householdMembers[index].relationshipToClient ===
        RelationshipTypeEnum.Other && (
        <Input
          placeholder="Enter type of relationship"
          label="Type of Relationship"
          name={`householdMembers[${index}].relationshipToClientOther`}
          control={control}
        />
      )}
      <Input
        placeholder="Name"
        autoCorrect={false}
        label="Name"
        name={`householdMembers[${index}].name`}
        control={control}
      />
      {householdMembers[index].relationshipToClient !==
        RelationshipTypeEnum.Pet && (
        <>
          <Gender index={index} />
          <DateOfBirth index={index} />
        </>
      )}
      <View
        style={{
          marginTop: Spacings.sm,
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: Spacings.md,
        }}
      >
        <TextButton
          color={Colors.PRIMARY}
          title="Remove"
          onPress={() => handleRemove()}
          accessibilityHint="Removes Household"
        />

        <TextButton
          color={Colors.PRIMARY}
          title="Reset"
          onPress={() => handleReset()}
          accessibilityHint="Clears Household fields"
        />
      </View>
    </View>
  );
}
