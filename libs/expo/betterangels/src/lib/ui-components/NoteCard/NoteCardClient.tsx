import { Colors } from '@monorepo/expo/shared/static';
import { Avatar, BodyText } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { NoteType } from '../../apollo';

interface INoteCardClientProps {
  client: NoteType['client'];
}

export default function NoteCardClient(props: INoteCardClientProps) {
  const { client } = props;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Avatar
        mr="xs"
        size="sm"
        accessibilityLabel={client?.email || 'unknown client'}
        accessibilityHint={
          `${client?.email} client's avatar` || `client's avatar`
        }
      />
      <BodyText size="sm" color={Colors.PRIMARY_EXTRA_DARK}>
        {client?.firstName} {client?.lastName}
      </BodyText>
    </View>
  );
}
