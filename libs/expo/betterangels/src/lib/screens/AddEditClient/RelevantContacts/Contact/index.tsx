import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  Input,
  Select,
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
import { enumDisplayRelevant } from '../../../../static/enumDisplayMapping';

interface IContactProps {
  index: number;
  remove: (index: number) => void;
}

export default function Contact(props: IContactProps) {
  const { index, remove } = props;
  const { control, setValue, watch } = useFormContext<
    UpdateClientProfileInput | CreateClientProfileInput
  >();

  const contacts = watch('contacts');
  const relationship = watch(
    `contacts[${index}].relationshipToClient` as `contacts.${number}.relationshipToClient`
  );

  const handleRemove = () => {
    remove(index);
    if (contacts?.length === 1) {
      setValue('contacts', []);
    }
  };

  const handleReset = () => {
    setValue(
      `contacts[${index}].relationshipToClient` as `contacts.${number}.relationshipToClient`,
      null
    );
    setValue(`contacts[${index}].name` as `contacts.${number}.name`, null);
    setValue(`contacts[${index}].email` as `contacts.${number}.email`, null);
    setValue(
      `contacts[${index}].phoneNumber` as `contacts.${number}.phoneNumber`,
      null
    );
    setValue(
      `contacts[${index}].mailingAddress` as `contacts.${number}.mailingAddress`,
      null
    );
  };

  if (!relationship) {
    return (
      <Select
        labelMarginLeft="xs"
        label="Type of Relationship"
        placeholder="Select Relationship"
        defaultValue={(relationship as RelationshipTypeEnum | undefined) ?? ''}
        onValueChange={(enumValue) =>
          setValue(
            `contacts[${index}].relationshipToClient` as `contacts.${number}.relationshipToClient`,
            enumValue as RelationshipTypeEnum
          )
        }
        items={Object.entries(enumDisplayRelevant).map(
          ([enumValue, displayValue]) => ({
            displayValue: displayValue,
            value: enumValue,
          })
        )}
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
      <Input
        placeholder="Name"
        label="Name"
        name={`contacts[${index}].name`}
        control={control}
      />
      <Input
        placeholder="Email"
        label="Email"
        keyboardType="email-address"
        name={`contacts[${index}].email`}
        control={control}
      />
      <Input
        placeholder="Phone Number"
        label="Phone Number"
        keyboardType="phone-pad"
        maxLength={12}
        name={`contacts[${index}].phoneNumber`}
        control={control}
      />
      <Input
        placeholder="Mailing Address"
        label="Mailing Address"
        name={`contacts[${index}].mailingAddress`}
        control={control}
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
          accessibilityHint="Removes Relevant contact"
        />

        <TextButton
          color={Colors.PRIMARY}
          title="Reset"
          onPress={() => handleReset()}
          accessibilityHint="Removes Relevant contact"
        />
      </View>
    </View>
  );
}
