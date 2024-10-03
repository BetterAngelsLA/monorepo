import { Spacings } from '@monorepo/expo/shared/static';
import { Accordion } from '@monorepo/expo/shared/ui-components';
import { RefObject } from 'react';
import { ScrollView, View } from 'react-native';
import MailingAddress from './MailingAddress';
import ResidenceAddress from './ResidenceAddress';

interface IContactInfoProps {
  expanded: undefined | string | null;
  setExpanded: (expanded: undefined | string | null) => void;
  scrollRef: RefObject<ScrollView>;
}

export default function ContactInfo(props: IContactInfoProps) {
  const { scrollRef, expanded, setExpanded } = props;

  const isContactInfo = expanded === 'Contact Info';
  return (
    <Accordion
      scrollRef={scrollRef}
      expanded={expanded}
      setExpanded={() => {
        setExpanded(isContactInfo ? null : 'Contact Info');
      }}
      mb="xs"
      title="Contact Info"
    >
      {isContactInfo && (
        <View
          style={{
            height: isContactInfo ? 'auto' : 0,
            overflow: 'hidden',
            gap: Spacings.xs,
          }}
        >
          <ResidenceAddress />
          <MailingAddress />
        </View>
      )}
    </Accordion>
  );
}
