import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  Button,
  Input,
  Select,
  TextButton,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { View } from 'react-native';
import {
  ClientContactInput,
  CreateClientProfileInput,
  RelationshipTypeEnum,
  UpdateClientProfileInput,
} from '../../../../apollo';
import { enumDisplayRelevant } from '../../../../static/enumDisplayMapping';

interface IContactProps {
  index: number;
  item: ClientContactInput;
  remove: (index: number) => void;
}

export default function Contact(props: IContactProps) {
  const { index, item, remove } = props;
  const { control, setValue, watch } = useFormContext<
    UpdateClientProfileInput | CreateClientProfileInput
  >();
  const [edit, setEdit] = useState(false);
  console.log(item, index);
  const contacts = watch('contacts');
  const relationship = watch(
    `contacts[${index}].relationshipToClient` as `contacts.${number}.relationshipToClient`
  );

  const handleRemove = (index: number) => {
    remove(index);
    if (contacts?.length === 1) {
      setValue('contacts', []);
    }
  };

  return (
    <View
      style={{
        marginBottom: Spacings.sm,
        gap: Spacings.sm,
        borderRadius: Radiuses.xs,
        borderColor: Colors.NEUTRAL_LIGHT,
        borderWidth: 1,
        backgroundColor: Colors.WHITE,
        paddingVertical: Spacings.md,
        paddingHorizontal: Spacings.sm,
      }}
    >
      {edit ? (
        <>
          <Select
            label="Relationship"
            placeholder="Select Relationship"
            defaultValue={relationship as RelationshipTypeEnum}
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
              flexDirection: 'row',
              justifyContent: 'flex-end',
              alignItems: 'center',
            }}
          >
            <TextButton
              mr="md"
              color={Colors.PRIMARY}
              title="Remove"
              onPress={() => handleRemove(index)}
              accessibilityHint="Removes Relevant contact"
            />
            <Button
              onPress={() => setEdit(false)}
              variant="primary"
              title="Done"
              accessibilityLabel={'save relevant contact'}
              accessibilityHint={'save Relevant contact'}
            />
          </View>
        </>
      ) : (
        <View style={{ gap: Spacings.xs }}>
          <View
            style={{
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <TextRegular>
              {item.relationshipToClient &&
                enumDisplayRelevant[item.relationshipToClient]}
            </TextRegular>
            <TextButton
              fontSize="sm"
              onPress={() => setEdit(true)}
              title="Edit"
              accessibilityHint={'opens edit mode'}
            />
          </View>
          {item?.name && (
            <TextRegular size="sm" color={Colors.NEUTRAL_DARK}>
              {item.name}
            </TextRegular>
          )}
          {item?.email && (
            <TextRegular size="sm" color={Colors.NEUTRAL_DARK}>
              {item.email}
            </TextRegular>
          )}
          {item?.phoneNumber && (
            <TextRegular size="sm" color={Colors.NEUTRAL_DARK}>
              {item.phoneNumber}
            </TextRegular>
          )}
          {item?.mailingAddress && (
            <TextRegular size="sm" color={Colors.NEUTRAL_DARK}>
              {item.mailingAddress}
            </TextRegular>
          )}
        </View>
      )}
    </View>
  );
}
