import { ErrorMessage } from '@hookform/error-message';
import {
  Colors,
  Radiuses,
  Regex,
  Spacings,
} from '@monorepo/expo/shared/static';
import {
  Input,
  Select,
  TextBold,
  TextButton,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { View } from 'react-native';
import {
  CreateClientProfileInput,
  RelationshipTypeEnum,
  UpdateClientProfileInput,
} from '../../../../apollo';
import { clientRelevantContactEnumDisplay } from '../../../../static/enumDisplayMapping';

interface IContactProps {
  index: number;
  remove: (index: number) => void;
}

export default function Contact(props: IContactProps) {
  const { index, remove } = props;
  const {
    control,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<UpdateClientProfileInput | CreateClientProfileInput>();

  const contactPhoneNumber = watch(
    `contacts[${index}].phoneNumber` as `contacts.${number}.phoneNumber`
  );

  useEffect(() => {
    if (contactPhoneNumber === '') {
      setValue(
        `contacts[${index}].phoneNumber` as `contacts.${number}.phoneNumber`,
        null
      );
    }
  }, [contactPhoneNumber, index]);

  const relationship = watch(
    `contacts[${index}].relationshipToClient` as `contacts.${number}.relationshipToClient`
  );

  const contacts = watch('contacts') || [];

  const handleRemove = () => {
    remove(index);
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
    setValue(
      `contacts[${index}].relationshipToClient` as `contacts.${number}.relationshipToClient`,
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
            `contacts[${index}].relationshipToClient` as `contacts.${number}.relationshipToClient`,
            enumValue as RelationshipTypeEnum
          )
        }
        items={Object.entries(clientRelevantContactEnumDisplay).map(
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
      <TextBold size="lg">
        {clientRelevantContactEnumDisplay[relationship]}
      </TextBold>
      <Input
        placeholder="Name"
        autoCorrect={false}
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
        maxLength={10}
        name={`contacts[${index}].phoneNumber`}
        control={control}
        rules={{
          pattern: {
            value: Regex.phoneNumber,
            message:
              'Enter a 10-digit phone number without space or special characters',
          },
        }}
      />
      <ErrorMessage
        errors={errors}
        name={`contacts[${index}].phoneNumber`}
        render={({ message }: { message: string }) => {
          return (
            <TextRegular size="sm" color={Colors.ERROR}>
              {message}
            </TextRegular>
          );
        }}
      />
      <Input
        placeholder="Mailing Address"
        label="Mailing Address"
        name={`contacts[${index}].mailingAddress`}
        control={control}
      />
      {contacts[index].relationshipToClient === RelationshipTypeEnum.Other && (
        <Input
          placeholder="Relationship to Client Other"
          label="Relationship to Client Other"
          name={`contacts[${index}].relationshipToClientOther`}
          control={control}
        />
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
          accessibilityHint="Removes Relevant contact"
        />

        <TextButton
          color={Colors.PRIMARY}
          title="Reset"
          onPress={() => handleReset()}
          accessibilityHint="Clears Relevant contact fields"
        />
      </View>
    </View>
  );
}
