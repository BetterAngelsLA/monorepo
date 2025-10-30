import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextMedium } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { HmisClientNoteListType } from '../../apollo';

interface IProgramNoteCardClientProps {
  clientProfile?: HmisClientNoteListType['items'][number]['client'];
}

export default function ProgramNoteCardClient(
  props: IProgramNoteCardClientProps
) {
  const { clientProfile } = props;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: Spacings.lg,
      }}
    >
      {/* TODO: add after BA integration
      <Avatar
        mr="xs"
        size="sm"
        accessibilityLabel={`client's profile photo`}
        accessibilityHint={`client's profile photo`}
        imageUrl={clientProfile?.profilePhoto?.url}
      /> */}
      <TextMedium size="sm" color={Colors.PRIMARY_EXTRA_DARK}>
        {clientProfile?.firstName} {clientProfile?.lastName}
      </TextMedium>
    </View>
  );
}
