import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Accordion, TextButton } from '@monorepo/expo/shared/ui-components';
import { RefObject, useMemo } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import {
  CreateClientProfileInput,
  RelationshipTypeEnum,
  UpdateClientProfileInput,
} from '../../../apollo';
import Contact from './Contact';

interface IRelevantContactsProps {
  expanded: undefined | string | null;
  setExpanded: (expanded: undefined | string | null) => void;
  scrollRef: RefObject<ScrollView>;
}

export default function RelevantContacts(props: IRelevantContactsProps) {
  const { scrollRef, expanded, setExpanded } = props;

  const { control } = useFormContext<
    UpdateClientProfileInput | CreateClientProfileInput
  >();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'contacts',
  });

  const isRelevantContacts = expanded === 'Relevant Contacts';

  const sortedContacts = useMemo(() => {
    const caseManagerContact = fields.find(
      (contact) =>
        contact.relationshipToClient === RelationshipTypeEnum.CurrentCaseManager
    );

    const otherContacts = fields
      .filter(
        (contact) =>
          contact.relationshipToClient !==
          RelationshipTypeEnum.CurrentCaseManager
      )
      .sort((a, b) =>
        (a.relationshipToClient ?? '').localeCompare(
          b.relationshipToClient ?? ''
        )
      );

    return caseManagerContact
      ? [caseManagerContact, ...otherContacts]
      : otherContacts;
  }, [fields]);

  return (
    <Accordion
      scrollRef={scrollRef}
      expanded={expanded}
      setExpanded={() => {
        setExpanded(isRelevantContacts ? null : 'Relevant Contacts');
      }}
      title="Relevant Contacts"
    >
      {isRelevantContacts && (
        <View
          style={{
            height: isRelevantContacts ? 'auto' : 0,
            overflow: 'hidden',
            gap: Spacings.xs,
          }}
        >
          {sortedContacts.map((_, index) => (
            <Contact
              remove={remove}
              scrollRef={scrollRef}
              key={index}
              index={index}
            />
          ))}
          <View style={{ alignItems: 'flex-start' }}>
            <TextButton
              onPress={() => append({ name: '' })}
              title="Add Relevant Contact"
              color={Colors.PRIMARY}
              fontSize="sm"
              accessibilityLabel={'add Relevant contact'}
              accessibilityHint={'add Relevant contact'}
            />
          </View>
        </View>
      )}
    </Accordion>
  );
}
