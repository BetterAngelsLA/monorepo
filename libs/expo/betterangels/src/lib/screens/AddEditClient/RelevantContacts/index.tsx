import { Spacings } from '@monorepo/expo/shared/static';
import { Accordion, Button } from '@monorepo/expo/shared/ui-components';
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
            gap: Spacings.sm,
            height: isRelevant ? 'auto' : 0,
            overflow: 'hidden',
          }}
        >
          {fields.map((item, index) => (
            <Contact remove={remove} key={index} item={item} index={index} />
          ))}
          <Button
            onPress={() => append({ name: '' })}
            variant="primary"
            title="Add Relevant Contact"
            accessibilityLabel={'add Relevant contact'}
            accessibilityHint={'add Relevant contact'}
          />
        </View>
      )}
    </Accordion>
  );
}
