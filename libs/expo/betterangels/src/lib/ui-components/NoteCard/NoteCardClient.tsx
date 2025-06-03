import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Avatar, TextMedium } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { NotesQuery } from '../../apollo';

interface INoteCardClientProps {
  clientProfile?: NotesQuery['notes']['results'][0]['clientProfile'];
}

export default function NoteCardClient(props: INoteCardClientProps) {
  const { clientProfile } = props;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: Spacings.lg,
      }}
    >
      <Avatar
        mr="xs"
        size="sm"
        accessibilityLabel={`client's profile photo`}
        accessibilityHint={`client's profile photo`}
      />
      <TextMedium size="sm" color={Colors.PRIMARY_EXTRA_DARK}>
        {clientProfile?.firstName} {clientProfile?.lastName}
      </TextMedium>
    </View>
  );
}
