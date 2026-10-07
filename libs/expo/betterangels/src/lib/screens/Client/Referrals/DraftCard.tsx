import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  DiscardModal,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { Pressable, StyleSheet, View } from 'react-native';

// Compact "edited" suffix: time for today's draft, date for older ones.
function formatEdited(updatedAt?: number): string {
  if (!updatedAt) return '';
  const d = new Date(updatedAt);
  const isToday = d.toDateString() === new Date().toDateString();
  return ` · ${
    isToday
      ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      : d.toLocaleDateString()
  }`;
}

// The in-progress local draft, made visible in the list (tap to resume). Styled
// unmistakably as a not-yet-submitted, on-device draft — dashed edge + badge.
export function DraftCard({
  updatedAt,
  onResume,
  onDiscard,
}: {
  updatedAt?: number;
  onResume: () => void;
  onDiscard: () => void;
}) {
  return (
    <Pressable
      testID="referral-draft-card"
      style={styles.draftCard}
      onPress={onResume}
      // Not an accessibility element on purpose: a grouped parent makes the
      // nested Discard control unreachable to screen readers. Resume and
      // Discard are each exposed by their own child control instead.
      accessible={false}
    >
      {/* Row 1: badge + title + resume affordance */}
      <View style={styles.draftRow}>
        <View style={styles.draftBadge}>
          <TextRegular size="xs" color={Colors.PRIMARY}>
            DRAFT
          </TextRegular>
        </View>
        <TextBold
          size="sm"
          color={Colors.NEUTRAL_DARK}
          numberOfLines={1}
          style={styles.draftGrow}
        >
          Referral in progress
        </TextBold>
        <Pressable
          testID="draft-resume-btn"
          onPress={onResume}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="resume referral draft"
          accessibilityHint="reopens your in-progress referral"
        >
          <TextBold size="sm" color={Colors.PRIMARY}>
            Resume ›
          </TextBold>
        </Pressable>
      </View>

      {/* Row 2: provenance + discard */}
      <View style={styles.draftRow}>
        <TextRegular
          size="xs"
          color={Colors.NEUTRAL}
          numberOfLines={1}
          style={styles.draftGrow}
        >
          On this device · not submitted{formatEdited(updatedAt)}
        </TextRegular>
        <DiscardModal
          title="Discard draft?"
          body="This deletes the in-progress referral and cannot be undone."
          onDiscard={onDiscard}
          button={
            <Pressable
              testID="draft-discard-btn"
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="discard referral draft"
              accessibilityHint="permanently deletes this in-progress referral"
            >
              <TextRegular size="xs" color={Colors.ERROR}>
                Discard
              </TextRegular>
            </Pressable>
          }
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  draftCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
    borderStyle: 'dashed',
    paddingHorizontal: Spacings.md,
    paddingVertical: Spacings.sm,
    marginBottom: Spacings.sm,
    gap: Spacings.xxs,
  },
  draftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
  },
  draftGrow: {
    flex: 1,
    flexShrink: 1,
  },
  draftBadge: {
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
});
