import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Avatar,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

type TVariant = 'inline' | 'stacked';

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
   * `inline` puts the label beside the name — the card's compact row.
   * `stacked` puts it above the avatar-and-name row, which is what the task
   * detail uses.
   */
  variant?: TVariant;
  /**
   * Drop the fixed label column so the row can sit in a narrow cell of the
   * card's person grid. Names then truncate rather than pushing the label off.
   */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * One person on a task: avatar, what they are to the task, and their name.
 *
 * Every person rendered on a task goes through here so the rows cannot drift
 * apart — before this, only the assignee was labelled, and the client and the
 * creator were two anonymous avatar-and-name rows.
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
    variant = 'inline',
    compact = false,
    style,
  } = props;

  const isStacked = variant === 'stacked';

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
        {!isStacked && (
          <View style={styles.inline}>
            <TextRegular
              size="sm"
              color={Colors.NEUTRAL_DARK}
              style={compact ? styles.labelCompact : styles.label}
            >
              {label}
            </TextRegular>
            <TextBold
              size="sm"
              color={Colors.PRIMARY_EXTRA_DARK}
              numberOfLines={1}
              style={styles.name}
            >
              {name}
            </TextBold>
          </View>
        )}

        {isStacked && (
          <TextBold
            size="sm"
            color={Colors.PRIMARY_EXTRA_DARK}
            numberOfLines={1}
          >
            {name}
          </TextBold>
        )}

        {!!secondary && (
          <TextRegular size="sm" numberOfLines={1}>
            {secondary}
          </TextRegular>
        )}
      </View>
    </>
  );

  const personRow = onPress ? (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [styles.person, pressed ? styles.pressed : null]}
    >
      {person}
    </Pressable>
  ) : (
    <View style={styles.person}>{person}</View>
  );

  if (!isStacked) {
    return (
      <View
        style={[styles.inlineWrap, compact ? styles.compactWrap : null, style]}
      >
        {personRow}
      </View>
    );
  }

  // The label is a caption for the whole row, so it sits above the avatar
  // rather than beside it — beside the avatar it read as if it labelled the
  // photo and pushed the name onto a second line under it.
  return (
    <View style={styles.stacked}>
      <TextRegular size="sm" color={Colors.NEUTRAL_DARK}>
        {label}
      </TextRegular>
      {personRow}
    </View>
  );
}

const styles = StyleSheet.create({
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  inlineWrap: {
    marginBottom: Spacings.xs,
  },
  stacked: {
    alignSelf: 'stretch',
    marginBottom: Spacings.sm,
  },
  body: {
    flexShrink: 1,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // A fixed label column keeps the three names aligned down the card, whatever
  // the label's length.
  label: {
    minWidth: 88,
  },
  labelCompact: {
    marginRight: Spacings.xs,
  },
  compactWrap: {
    marginBottom: 0,
  },
  name: {
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.6,
  },
});
