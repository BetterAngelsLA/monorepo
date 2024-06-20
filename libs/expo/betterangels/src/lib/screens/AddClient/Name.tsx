import { Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  FieldCard,
  TextMedium,
} from '@monorepo/expo/shared/ui-components';
import { RefObject } from 'react';
import { ScrollView, View } from 'react-native';
import { CreateClientProfileInput } from '../../apollo';

interface INameProps {
  client: CreateClientProfileInput;
  setClient: (client: CreateClientProfileInput) => void;
  expanded: undefined | string | null;
  setExpanded: (expanded: undefined | string | null) => void;
  scrollRef: RefObject<ScrollView>;
  errorState: string | null;
}

export default function Name(props: INameProps) {
  const { expanded, setClient, client, setExpanded, scrollRef, errorState } =
    props;

  const isName = expanded === 'Name';
  return (
    <FieldCard
      error={errorState ? 'First Name is required' : ''}
      scrollRef={scrollRef}
      expanded={expanded}
      setExpanded={() => {
        setExpanded(isName ? null : 'Name');
      }}
      required
      mb="xs"
      actionName={
        !client?.user.firstName &&
        !client?.user.lastName &&
        !client?.nickname &&
        !isName ? (
          <TextMedium size="sm">Add Name</TextMedium>
        ) : (
          <TextMedium size="sm">
            {client?.user.firstName} {client?.user.lastName}
          </TextMedium>
        )
      }
      title="Name"
    >
      <View
        style={{
          gap: Spacings.sm,
          height: isName ? 'auto' : 0,
          overflow: 'hidden',
        }}
      >
        <BasicInput
          required
          error={!!errorState}
          placeholder="Enter First Name"
          label="First Name"
          onDelete={() => {
            setClient({
              ...client,
              user: {
                ...client.user,
                firstName: '',
              },
            });
          }}
          onChangeText={(e) =>
            setClient({
              ...client,
              user: {
                ...client.user,
                firstName: e,
              },
            })
          }
          value={client.user.firstName || ''}
        />
        <BasicInput
          placeholder="Enter Last Name"
          label="Last Name"
          onDelete={() => {
            setClient({
              ...client,
              user: {
                ...client.user,
                lastName: '',
              },
            });
          }}
          onChangeText={(e) =>
            setClient({
              ...client,
              user: {
                ...client.user,
                lastName: e,
              },
            })
          }
          value={client.user.lastName || ''}
        />
        <BasicInput
          placeholder="Enter Nickname"
          label="Nickname"
          onDelete={() => {
            setClient({
              ...client,
              nickname: '',
            });
          }}
          onChangeText={(e) =>
            setClient({
              ...client,
              nickname: e,
            })
          }
          value={client.nickname || ''}
        />
      </View>
    </FieldCard>
  );
}
