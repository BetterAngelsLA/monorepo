import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Avatar, TextBold } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';

type TaskCardClientProps = {
  firstName?: string | null;
  lastName?: string | null;
  profilePhotoUrl?: string | null;
};

export default function TaskCardClient(props: TaskCardClientProps) {
  const { firstName, lastName, profilePhotoUrl } = props;

  if (!firstName && !lastName && !profilePhotoUrl) {
    return null;
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacings.xs,
      }}
    >
      <Avatar
        mr="xs"
        size="sm"
        accessibilityLabel={`client's profile photo`}
        accessibilityHint={`client's profile photo`}
        imageUrl={profilePhotoUrl || undefined}
      />
      <TextBold size="sm" color={Colors.PRIMARY_EXTRA_DARK}>
        {firstName} {lastName}
      </TextBold>
    </View>
  );
}
