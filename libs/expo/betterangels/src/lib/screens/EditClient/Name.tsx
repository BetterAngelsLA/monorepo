import { Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  FieldCard,
  TextMedium,
} from '@monorepo/expo/shared/ui-components';
import { RefObject } from 'react';
import { ScrollView, View } from 'react-native';
import { UpdateClientProfileInput } from '../../apollo';

interface INameProps {
  client: UpdateClientProfileInput | undefined;
  setClient: (client: UpdateClientProfileInput | undefined) => void;
  expanded: undefined | string | null;
  setExpanded: (expanded: undefined | string | null) => void;
  scrollRef: RefObject<ScrollView>;
  errorState: {
    firstName?: string;
    email?: string;
  };
}

export default function Name(props: INameProps) {
  const { expanded, setClient, client, setExpanded, scrollRef, errorState } =
    props;

  const isName = expanded === 'Name';
  return (
    <FieldCard
      error={errorState && errorState.firstName ? 'First Name is required' : ''}
      scrollRef={scrollRef}
      expanded={expanded}
      setExpanded={() => {
        setExpanded(isName ? null : 'Name');
      }}
      required
      mb="xs"
      actionName={
        !client?.user?.firstName && !isName ? (
          <TextMedium size="sm">Add Name</TextMedium>
        ) : (
          <TextMedium size="sm">
            {client?.user?.firstName} {client?.user?.lastName}
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
          error={errorState ? !!errorState.firstName : false}
          placeholder="Enter First Name"
          label="First Name"
          onDelete={() => {
            client &&
              setClient({
                ...client,
                user: {
                  ...client.user,
                  firstName: '',
                },
              });
          }}
          onChangeText={(e) =>
            client &&
            setClient({
              ...client,
              user: {
                ...client.user,
                firstName: e,
              },
            })
          }
          value={client?.user?.firstName || ''}
        />
        <BasicInput
          placeholder="Enter Middle Name"
          label="Middle Name"
          onDelete={() => {
            client &&
              setClient({
                ...client,
                user: {
                  ...client.user,
                  middleName: '',
                },
              });
          }}
          onChangeText={(e) =>
            client &&
            setClient({
              ...client,
              user: {
                ...client.user,
                middleName: e,
              },
            })
          }
          value={client?.user?.middleName || ''}
        />
        <BasicInput
          placeholder="Enter Last Name"
          label="Last Name"
          onDelete={() => {
            client &&
              setClient({
                ...client,
                user: {
                  ...client.user,
                  lastName: '',
                },
              });
          }}
          onChangeText={(e) =>
            client &&
            setClient({
              ...client,
              user: {
                ...client.user,
                lastName: e,
              },
            })
          }
          value={client?.user?.lastName || ''}
        />
        <BasicInput
          placeholder="Enter Nickname"
          label="Nickname"
          onDelete={() => {
            client &&
              setClient({
                ...client,
                nickname: '',
              });
          }}
          onChangeText={(e) =>
            client &&
            setClient({
              ...client,
              nickname: e,
            })
          }
          value={client?.nickname || ''}
        />
      </View>
    </FieldCard>
  );
}
