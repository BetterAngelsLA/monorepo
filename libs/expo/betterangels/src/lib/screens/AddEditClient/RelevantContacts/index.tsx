import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Accordion, TextButton } from '@monorepo/expo/shared/ui-components';
import { RefObject } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import {
  CreateClientProfileInput,
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

  const isRelevant = expanded === 'Relevant Contacts';

  return (
    <Accordion
      scrollRef={scrollRef}
      expanded={expanded}
      setExpanded={() => {
        setExpanded(isRelevant ? null : 'Relevant Contacts');
      }}
      mb="xs"
      title="Relevant Contacts"
    >
      {isRelevant && (
        <View
          style={{
            height: isRelevant ? 'auto' : 0,
            overflow: 'hidden',
          }}
        >
          {fields.map((_, index) => (
            <Contact remove={remove} key={index} index={index} />
          ))}
          <View style={{ alignItems: 'flex-start', marginTop: Spacings.sm }}>
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
