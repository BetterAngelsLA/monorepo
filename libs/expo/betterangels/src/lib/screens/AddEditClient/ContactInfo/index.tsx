import { Spacings } from '@monorepo/expo/shared/static';
import { Accordion } from '@monorepo/expo/shared/ui-components';
import { RefObject } from 'react';
import { ScrollView, View } from 'react-native';
import EmailAddress from './EmailAddress';
import MailingAddress from './MailingAddress';
import PhoneNumbers from './PhoneNumbers';
import PreferredCommunication from './PreferredCommunication';
import ResidenceAddress from './ResidenceAddress';
import SocialMedia from './SocialMedia';

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
          <ResidenceAddress scrollRef={scrollRef} />
          <MailingAddress scrollRef={scrollRef} />
          <PhoneNumbers />
          <EmailAddress />
          <SocialMedia />
          <PreferredCommunication />
        </View>
      )}
    </Accordion>
  );
}
