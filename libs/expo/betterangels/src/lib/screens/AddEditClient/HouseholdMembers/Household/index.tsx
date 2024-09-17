import {
  Colors,
  Radiuses,
  Regex,
  Spacings,
} from '@monorepo/expo/shared/static';
import {
  DatePicker,
  Input,
  Radio,
  Select,
  TextBold,
  TextButton,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';
import { View } from 'react-native';
import {
  CreateClientProfileInput,
  GenderEnum,
  RelationshipTypeEnum,
  UpdateClientProfileInput,
} from '../../../../apollo';
import {
  enumDisplayGender,
  enumDisplayRelevant,
} from '../../../../static/enumDisplayMapping';

interface IHouseholdProps {
  index: number;
  remove: (index: number) => void;
}

export default function Household(props: IHouseholdProps) {
  const { index, remove } = props;
  const { control, setValue, watch } = useFormContext<
    UpdateClientProfileInput | CreateClientProfileInput
  >();

  const relationship = watch(
    `householdMembers[${index}].relationshipToClient` as `householdMembers.${number}.relationshipToClient`
  );

  const householdMembers = watch('householdMembers') || [];

  const handleRemove = () => {
    remove(index);
  };

  const handleReset = () => {
    setValue(
      `householdMembers[${index}].relationshipToClient` as `householdMembers.${number}.relationshipToClient`,
      null
    );
    setValue(
      `householdMembers[${index}].name` as `householdMembers.${number}.name`,
      null
    );
    setValue(
      `householdMembers[${index}].gender` as `householdMembers.${number}.gender`,
      null
    );
    setValue(
      `householdMembers[${index}].dateOfBirth` as `householdMembers.${number}.dateOfBirth`,
      null
    );
    setValue(
      `householdMembers[${index}].relationshipToClient` as `householdMembers.${number}.relationshipToClient`,
      null
    );
  };

  if (!relationship) {
    return (
      <Select
        boldLabel
        labelMarginLeft="xs"
        label="Type of Relationship"
        placeholder="Select Relationship"
        defaultValue={(relationship as RelationshipTypeEnum | undefined) ?? ''}
        onValueChange={(enumValue) =>
          setValue(
            `householdMembers[${index}].relationshipToClient` as `householdMembers.${number}.relationshipToClient`,
            enumValue as RelationshipTypeEnum
          )
        }
        items={Object.entries(enumDisplayRelevant)
          .filter(
            ([enumValue]) =>
              enumValue !== 'CURRENT_CASE_MANAGER' &&
              enumValue !== 'PAST_CASE_MANAGER' &&
              enumValue !== 'ORGANIZATION'
          )
          .map(([enumValue, displayValue]) => ({
            displayValue: displayValue,
            value: enumValue,
          }))}
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
      <TextBold size="lg">{enumDisplayRelevant[relationship]}</TextBold>
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

      <View style={{ gap: Spacings.xs }}>
        <TextRegular size="sm">Gender</TextRegular>
        {Object.entries(enumDisplayGender).map(([enumValue, displayValue]) => (
          <Radio
            key={enumValue}
            value={
              householdMembers[index].gender
                ? enumDisplayGender[householdMembers[index].gender]
                : ''
            }
            label={displayValue}
            onPress={() => {
              const updatedHouseholdMembers = [...householdMembers];
              updatedHouseholdMembers[index] = {
                ...updatedHouseholdMembers[index],
                gender: enumValue as GenderEnum,
              };
              setValue('householdMembers', updatedHouseholdMembers);
            }}
            accessibilityHint="selects hmis id"
          />
        ))}
      </View>

      <DatePicker
        label="Date of Birth"
        disabled
        maxDate={new Date()}
        pattern={Regex.date}
        mode="date"
        format="MM/dd/yyyy"
        placeholder="MM/DD/YYYY"
        mt="xs"
        value={householdMembers[index].dateOfBirth || new Date()}
        setValue={(date) => {
          const updatedHouseholdMembers = [...householdMembers];
          updatedHouseholdMembers[index] = {
            ...updatedHouseholdMembers[index],
            dateOfBirth: date,
          };
          setValue('householdMembers', updatedHouseholdMembers);
        }}
      />

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
