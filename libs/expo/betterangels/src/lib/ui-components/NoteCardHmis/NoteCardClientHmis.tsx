import { useClientPhotoContentUriHmis } from '@monorepo/expo/shared/clients';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Avatar, TextMedium } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { HmisNoteType } from '../../apollo';

interface INoteCardClientHmisProps {
  clientProfile?: HmisNoteType['hmisClientProfile'];
}

export default function NoteCardClientHmis(props: INoteCardClientHmisProps) {
  const { clientProfile } = props;

  const { thumbnailUri, headers } = useClientPhotoContentUriHmis(
    clientProfile?.hmisId
  );

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
        imageUrl={thumbnailUri}
        headers={headers}
      />
      <TextMedium size="sm" color={Colors.PRIMARY_EXTRA_DARK}>
        {clientProfile?.firstName} {clientProfile?.lastName}
      </TextMedium>
    </View>
  );
}
