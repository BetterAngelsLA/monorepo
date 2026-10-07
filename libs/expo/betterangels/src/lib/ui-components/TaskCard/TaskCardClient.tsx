import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Avatar, TextBold } from '@monorepo/expo/shared/ui-components';
import { Pressable, StyleSheet } from 'react-native';

type TaskCardClientProps = {
  firstName?: string | null;
  lastName?: string | null;
  profilePhotoUrl?: string | null;
  onPress?: () => void;
};

export default function TaskCardClient(props: TaskCardClientProps) {
  const { firstName, lastName, profilePhotoUrl, onPress } = props;

  if (!firstName && !lastName && !profilePhotoUrl) {
    return null;
  }

  const fullName = `${firstName ?? ''} ${lastName ?? ''}`.trim();

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
        imageUrl={profilePhotoUrl || undefined}
      />
      <TextBold size="sm" color={Colors.PRIMARY_EXTRA_DARK}>
        {firstName} {lastName}
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
