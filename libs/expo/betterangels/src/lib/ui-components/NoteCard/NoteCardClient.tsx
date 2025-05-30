import { Colors } from '@monorepo/expo/shared/static';
import { Avatar, TextRegular } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { NoteType } from '../../apollo';

interface INoteCardClientProps {
  clientProfile: NoteType['clientProfile'];
}

export default function NoteCardClient(props: INoteCardClientProps) {
  const { clientProfile } = props;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Avatar
          mr="xs"
          size="sm"
          accessibilityLabel={clientProfile?.email || 'unknown user'}
          accessibilityHint={
            `${clientProfile?.email} client's avatar` || `client's avatar`
          }
        />
        <TextRegular size="md" color={Colors.PRIMARY_EXTRA_DARK}>
          {clientProfile?.firstName} {clientProfile?.lastName}
        </TextRegular>
      </View>
    </View>
  );
}
