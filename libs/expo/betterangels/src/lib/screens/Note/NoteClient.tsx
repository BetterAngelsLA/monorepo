import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Avatar, TextRegular } from '@monorepo/expo/shared/ui-components';
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
        accessibilityLabel={clientProfile.email || 'unknown user'}
        accessibilityHint={
          `${clientProfile.email} client's avatar` || `client's avatar`
        }
      />
      <View style={{ paddingRight: Spacings.lg }}>
        <TextRegular size="md" color={Colors.PRIMARY_EXTRA_DARK}>
          {clientProfile.firstName} {clientProfile.lastName}
        </TextRegular>
      </View>
    </View>
  );
}
