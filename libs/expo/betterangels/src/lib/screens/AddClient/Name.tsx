import { Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  FieldCard,
  TextMedium,
} from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { CreateClientProfileInput } from '../../apollo';

interface INameProps {
  client: CreateClientProfileInput;
  setClient: (client: CreateClientProfileInput) => void;
  expanded: undefined | string | null;
  setExpanded: (expanded: undefined | string | null) => void;
}

export default function Name(props: INameProps) {
  const { expanded, setClient, client, setExpanded } = props;

  const isName = expanded === 'Name';
  return (
    <FieldCard
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
          ''
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
