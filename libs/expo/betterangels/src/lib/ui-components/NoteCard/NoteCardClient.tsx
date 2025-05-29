import { Colors } from '@monorepo/expo/shared/static';
import { Avatar, TextRegular } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { NoteType } from '../../apollo';

interface INoteCardClientProps {
  clientProfile?: NoteType['clientProfile'];
  createdBy: NoteType['createdBy'];
  isOnInteractionsPage: boolean;
}

export default function NoteCardClient(props: INoteCardClientProps) {
  const { clientProfile, createdBy, isOnInteractionsPage } = props;
  const displayDetails = isOnInteractionsPage ? clientProfile : createdBy;

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
          accessibilityLabel={displayDetails?.email || 'unknown user'}
          accessibilityHint={
            `${displayDetails?.email} client's avatar` || `client's avatar`
          }
        />
        <TextRegular size="sm" color={Colors.PRIMARY_EXTRA_DARK}>
          {displayDetails?.firstName} {displayDetails?.lastName}
        </TextRegular>
      </View>
    </View>
  );
}
