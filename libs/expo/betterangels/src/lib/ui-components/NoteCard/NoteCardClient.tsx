import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Avatar, TextMedium } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { NotesQuery, NoteType } from '../../apollo';

interface INoteCardClientProps {
  clientProfile?: NotesQuery['notes']['results'][0]['clientProfile'];
  createdBy: NoteType['createdBy'];
  isOnInteractionsPage: boolean;
  isSubmitted: boolean;
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
        accessibilityLabel={`client's avatar`}
        accessibilityHint={`client's avatar`}
      />
      <TextMedium size="sm" color={Colors.PRIMARY_EXTRA_DARK}>
        {clientProfile?.firstName} {clientProfile?.lastName}
      </TextMedium>
    </View>
  );
}
