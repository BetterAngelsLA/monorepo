import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Avatar,
  TextMedium,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

type TProps = {
  /** What the person is to the task — "Client", "Created by", "Assigned to". */
  label: string;
  name: string;
  /** Second line, e.g. the creator's organization and team. */
  secondary?: string | null;
  avatarUrl?: string | null;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /**
   * Grow the tap target to the 44pt guideline. Off by default: on the card the
   * row sits inside the card's own pressable, and a taller target would steal
   * taps meant to open the task. Safe on the detail page, where nothing else
   * competes.
   */
  expandTouchTarget?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * One person on a task: what they are to it, then their name beside an avatar.
 *
 * The role is an overline caption rather than inline text, so it labels the
 * block without competing with the name for the line — the pattern both the
 * card and the detail page use. Every person rendered on a task goes through
 * here so the rows cannot drift apart.
 */
export function TaskPersonRow(props: TProps) {
  const {
    label,
    name,
    secondary,
    avatarUrl,
    onPress,
    accessibilityLabel,
    accessibilityHint,
    expandTouchTarget = false,
    style,
  } = props;

  const person = (
    <>
      <Avatar
        mr="xs"
        size="sm"
        accessibilityLabel={`${label} profile photo`}
        accessibilityHint={`${label} profile photo`}
        imageUrl={avatarUrl || ''}
      />
      <View style={styles.body}>
        {/*
          Medium weight, not bold: the task's own title is the card's heading,
          and a row of bold names under it competes with it.
        */}
        <TextMedium size="sm" numberOfLines={1}>
          {name}
        </TextMedium>
        {!!secondary && (
          <TextRegular size="xs" color={Colors.NEUTRAL_DARK} numberOfLines={1}>
            {secondary}
          </TextRegular>
        )}
      </View>
    </>
  );

  return (
    <View style={[styles.block, style]}>
      <TextRegular
        size="xxs"
        textTransform="uppercase"
        color={Colors.NEUTRAL_DARK}
        style={styles.label}
      >
        {label}
      </TextRegular>

      {onPress ? (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          onPress={onPress}
          hitSlop={
            expandTouchTarget
              ? { top: Spacings.sm, bottom: Spacings.sm, left: 0, right: 0 }
              : undefined
          }
          style={({ pressed }) => [styles.person, pressed && styles.pressed]}
        >
          {person}
        </Pressable>
      ) : (
        <View style={styles.person}>{person}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginBottom: Spacings.xs,
  },
  label: {
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  body: {
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.6,
  },
});
