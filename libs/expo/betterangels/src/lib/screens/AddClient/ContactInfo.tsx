import { Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  FieldCard,
  TextBold,
  TextMedium,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { RefObject } from 'react';
import { ScrollView, View } from 'react-native';
import { CreateClientProfileInput } from '../../apollo';

interface IContactInfoProps {
  client: CreateClientProfileInput;
  setClient: (client: CreateClientProfileInput) => void;
  expanded: undefined | string | null;
  setExpanded: (expanded: undefined | string | null) => void;
  scrollRef: RefObject<ScrollView>;
}

export default function ContactInfo(props: IContactInfoProps) {
  const { expanded, setExpanded, client, setClient, scrollRef } = props;

  const isContactInfo = expanded === 'Contact Info';
  return (
    <FieldCard
      scrollRef={scrollRef}
      expanded={expanded}
      setExpanded={() => {
        setExpanded(isContactInfo ? null : 'Contact Info');
      }}
      mb="xs"
      actionName={
        !(client.address || client.phoneNumber) && !isContactInfo ? (
          <TextMedium size="sm">Add Contact Info</TextMedium>
        ) : (
          ''
        )
      }
      title="Contact Info"
    >
      <View
        style={{
          gap: Spacings.sm,
          height: isContactInfo ? 'auto' : 0,
          overflow: 'hidden',
        }}
      >
        <BasicInput
          onDelete={() => setClient({ ...client, address: '' })}
          label="Mailing Address"
          placeholder="Enter Mailing Address"
          value={client.address || ''}
          onChangeText={(e) => setClient({ ...client, address: e })}
        />
        <BasicInput
          onDelete={() => setClient({ ...client, phoneNumber: '' })}
          label="Phone Number"
          placeholder="Enter Phone Number"
          value={client.phoneNumber || ''}
          onChangeText={(e) => setClient({ ...client, phoneNumber: e })}
        />
      </View>

      {client.address && !isContactInfo && (
        <View style={{ marginBottom: Spacings.sm }}>
          <TextRegular mb="xxs" size="sm">
            Address
          </TextRegular>
          <TextBold size="sm">{client.address}</TextBold>
        </View>
      )}
      {client.phoneNumber && !isContactInfo && (
        <View style={{ marginBottom: Spacings.sm }}>
          <TextRegular size="sm">Phone Number</TextRegular>
          <TextBold size="sm">{client.phoneNumber}</TextBold>
        </View>
      )}
    </FieldCard>
  );
}
