import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Avatar, TextBold } from '@monorepo/expo/shared/ui-components';
import { Pressable, StyleSheet } from 'react-native';
import { TaskQuery } from './__generated__/Task.generated';

type TaskClientProps = {
  clientProfile: TaskQuery['task']['clientProfile'];
  onPress?: () => void;
};

export default function TaskClient(props: TaskClientProps) {
  const { clientProfile, onPress } = props;

  const fullName =
    `${clientProfile?.firstName ?? ''} ${clientProfile?.lastName ?? ''}`.trim();

  return (
    <Pressable
      accessibilityRole={onPress ? 'link' : undefined}
      accessibilityLabel={
        onPress
          ? `Open client profile${fullName ? `: ${fullName}` : ''}`
          : undefined
      }
      accessibilityHint={onPress ? "Opens the client's profile" : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        pressed && onPress ? styles.pressed : null,
      ]}
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: Spacings.xs,
  },
  pressed: {
    opacity: 0.6,
  },
});
