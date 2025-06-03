import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Avatar, TextMedium } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { NoteSummaryQuery } from './__generated__/NoteSummary.generated';

interface INoteClientProps {
  clientProfile?: NoteSummaryQuery['note']['clientProfile'];
}

export default function NoteClient(props: INoteClientProps) {
  const { clientProfile } = props;
  if (!clientProfile) {
    return;
  }
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <Avatar
        mr="xs"
        size="sm"
        imageUrl={clientProfile?.profilePhoto?.url}
        accessibilityLabel={`client's profile photo`}
        accessibilityHint={`client's profile photo`}
      />
      <View style={{ paddingRight: Spacings.lg }}>
        <TextMedium size="sm" color={Colors.PRIMARY_EXTRA_DARK}>
          {clientProfile.firstName} {clientProfile.lastName}
        </TextMedium>
      </View>
    </View>
  );
}
