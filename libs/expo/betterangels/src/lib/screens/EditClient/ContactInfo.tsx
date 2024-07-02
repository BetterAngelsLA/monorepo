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
import { UpdateClientProfileInput } from '../../apollo';

interface IContactInfoProps {
  client: UpdateClientProfileInput | undefined;
  setClient: (client: UpdateClientProfileInput | undefined) => void;
  expanded: undefined | string | null;
  setExpanded: (expanded: undefined | string | null) => void;
  scrollRef: RefObject<ScrollView>;
  errorState: { email?: string; firstName?: string };
}

export default function ContactInfo(props: IContactInfoProps) {
  const { expanded, setExpanded, client, setClient, scrollRef, errorState } =
    props;

  const isContactInfo = expanded === 'Contact Info';
  return (
    <FieldCard
      error={errorState && errorState.email}
      scrollRef={scrollRef}
      expanded={expanded}
      setExpanded={() => {
        setExpanded(isContactInfo ? null : 'Contact Info');
      }}
      mb="xs"
      actionName={
        !(client?.address || client?.phoneNumber || client?.user?.email) &&
        !isContactInfo ? (
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
          onDelete={() => client && setClient({ ...client, address: '' })}
          label="Mailing Address"
          placeholder="Enter Mailing Address"
          value={client?.address || ''}
          onChangeText={(e) => client && setClient({ ...client, address: e })}
        />
        <BasicInput
          onDelete={() => client && setClient({ ...client, phoneNumber: '' })}
          keyboardType="phone-pad"
          label="Phone Number"
          placeholder="Enter Phone Number"
          value={client?.phoneNumber || ''}
          onChangeText={(e) =>
            client && setClient({ ...client, phoneNumber: e })
          }
        />
        <BasicInput
          error={errorState ? !!errorState.email : false}
          keyboardType="email-address"
          onDelete={() =>
            client &&
            setClient({
              ...client,
              user: {
                ...client.user,
                email: '',
              },
            })
          }
          label="Email"
          placeholder="Enter Email"
          value={client?.user?.email || ''}
          onChangeText={(e) =>
            client &&
            setClient({
              ...client,
              user: {
                ...client.user,
                email: e,
              },
            })
          }
        />
      </View>

      {client?.address && !isContactInfo && (
        <View style={{ marginBottom: Spacings.sm }}>
          <TextRegular mb="xxs" size="sm">
            Address
          </TextRegular>
          <TextBold size="sm">{client.address}</TextBold>
        </View>
      )}
      {client?.phoneNumber && !isContactInfo && (
        <View style={{ marginBottom: Spacings.sm }}>
          <TextRegular size="sm">Phone Number</TextRegular>
          <TextBold size="sm">{client.phoneNumber}</TextBold>
        </View>
      )}
      {client?.user?.email && !isContactInfo && (
        <View style={{ marginBottom: Spacings.sm }}>
          <TextRegular size="sm">Email</TextRegular>
          <TextBold size="sm">{client.user.email}</TextBold>
        </View>
      )}
    </FieldCard>
  );
}
