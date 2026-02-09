import { useClientPhotoContentUri } from '@monorepo/expo/shared/clients';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Avatar, TextMedium } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { HmisNoteType } from '../../apollo';

interface IProgramNoteCardClientProps {
  clientProfile?: HmisNoteType['hmisClientProfile'];
}

export default function ProgramNoteCardClient(
  props: IProgramNoteCardClientProps
) {
  const { clientProfile } = props;

  const { contentUri, headers } = useClientPhotoContentUri(
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
        imageUrl={contentUri}
        imageCacheKey={contentUri}
        headers={headers}
      />
      <TextMedium size="sm" color={Colors.PRIMARY_EXTRA_DARK}>
        {clientProfile?.firstName} {clientProfile?.lastName}
      </TextMedium>
    </View>
  );
}
