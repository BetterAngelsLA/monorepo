import { Spacings } from '@monorepo/expo/shared/static';
import {
  Button,
  FieldCard,
  Input,
  Select,
} from '@monorepo/expo/shared/ui-components';
import { RefObject } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import {
  CreateClientProfileInput,
  RelationshipTypeEnum,
  UpdateClientProfileInput,
} from '../../apollo';
import { enumDisplayRelative } from '../../static/enumDisplayMapping';

interface IRelativeContactsProps {
  expanded: undefined | string | null;
  setExpanded: (expanded: undefined | string | null) => void;
  scrollRef: RefObject<ScrollView>;
}

export default function RelativeContacts(props: IRelativeContactsProps) {
  const { scrollRef, expanded, setExpanded } = props;
  const { control, setValue, watch } = useFormContext<
    UpdateClientProfileInput | CreateClientProfileInput
  >();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'contacts',
  });

  const isRlative = expanded === 'Relative Contacts';

  const contacts = watch('contacts');

  const handleRemove = (index: number) => {
    remove(index);
    if (contacts?.length === 1) {
      console.log('setting contacts to empty array');
      setValue('contacts', []);
    }
  };

  return (
    <FieldCard
      scrollRef={scrollRef}
      expanded={expanded}
      setExpanded={() => {
        setExpanded(isRlative ? null : 'Relative Contacts');
      }}
      mb="xs"
      actionName={null}
      title="Relative Contacts"
    >
      <View
        style={{
          gap: Spacings.sm,
          height: isRlative ? 'auto' : 0,
          overflow: 'hidden',
        }}
      >
        {fields.map((item, index) => (
          <View
            key={item.id}
            style={{ marginBottom: Spacings.sm, gap: Spacings.sm }}
          >
            <Select
              label="Relationship"
              placeholder="Select Relationship"
              onValueChange={(enumValue) =>
                setValue(
                  `contacts[${index}].relationshipToClient` as `contacts.${number}.relationshipToClient`,
                  enumValue as RelationshipTypeEnum
                )
              }
              items={Object.entries(enumDisplayRelative).map(
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
            <Button
              title="Remove Contact"
              onPress={() => handleRemove(index)}
              variant="negative"
              accessibilityHint="Removes relative contact"
            />
          </View>
        ))}
        <Button
          onPress={() => append({})}
          variant="primary"
          title="Add Relative Contact"
          accessibilityLabel={'add relative contact'}
          accessibilityHint={'add relative contact'}
        />
      </View>
    </FieldCard>
  );
}
