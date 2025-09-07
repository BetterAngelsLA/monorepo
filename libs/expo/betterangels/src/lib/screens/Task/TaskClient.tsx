import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Avatar, TextBold } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { TaskQuery } from './__generated__/Task.generated';

type TaskClientProps = {
  clientProfile: TaskQuery['task']['clientProfile'];
};

export default function TaskClient(props: TaskClientProps) {
  const { clientProfile } = props;

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
        imageUrl={clientProfile?.profilePhoto?.url}
      />
      <TextBold size="sm" color={Colors.PRIMARY_EXTRA_DARK}>
        {clientProfile?.firstName} {clientProfile?.lastName}
      </TextBold>
    </View>
  );
}
