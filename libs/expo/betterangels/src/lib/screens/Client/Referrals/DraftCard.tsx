import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  DiscardModal,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { Pressable, StyleSheet, View } from 'react-native';
import type { ReferralSubmission } from '../../../draft/referralDraft';
import { formatReferralEdited } from './referralPresentation';
import { RequestedArrivalDate } from './RequestedArrivalDate';

// The in-progress local draft, made visible in the list (tap to resume). Styled
// unmistakably as a not-yet-submitted, on-device draft — dashed edge + badge.
export function DraftCard({
  updatedAt,
  requestedArrivalDate,
  onResume,
  onDiscard,
  status = 'idle',
}: {
  updatedAt?: number;
  requestedArrivalDate?: unknown;
  onResume: () => void;
  onDiscard: () => void;
  status?: ReferralSubmission['status'];
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

      <RequestedArrivalDate value={requestedArrivalDate} />

      {/* Row 2: provenance + discard */}
      <View style={styles.draftRow}>
        <TextRegular size="xs" color={Colors.NEUTRAL} style={styles.draftGrow}>
          Last edited: {formatReferralEdited(updatedAt) || 'Not recorded'}
          {'\n'}
          {status === 'pending'
            ? 'Saving. You can pause and return.'
            : status === 'uncertain'
              ? 'Save outcome unknown. Check the referral list.'
              : status === 'saved'
                ? 'Saved. Local draft cleanup needed.'
                : 'On this device · not submitted'}
        </TextRegular>
        <DiscardModal
          title="Discard draft?"
          body={
            status === 'uncertain'
              ? 'This removes only the local draft. A saved referral may already exist; check the list before creating another.'
              : 'This removes the local draft. Existing saved referrals are not changed.'
          }
          onDiscard={onDiscard}
          button={
            <Pressable
              testID="draft-discard-btn"
              disabled={status === 'pending'}
              accessibilityState={{ disabled: status === 'pending' }}
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
