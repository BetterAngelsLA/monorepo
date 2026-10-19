import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Avatar,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';
import { ClientReferralsQuery } from './__generated__/Referrals.generated';
import { ShelterCard, TagRow } from './ShelterCard';
import { needLabelsFromIntake } from './clientNeeds';
import { decodeReferralNotes, summarizeIntake } from './referralIntakeSidecar';
import { shelterAttributeLabels } from './shelterAttributes';

// A card reads the intake answers stored on the referral (in the shelter's own
// vocabulary — see clientNeeds.ts), so it reflects the needs as they were
// recorded at the time rather than whatever is on screen now.

type ReferralCardProps = {
  referral: ClientReferralsQuery['referrals']['results'][number];
};

export function ReferralCard({ referral }: ReferralCardProps) {
  const referrerName = referral.createdBy
    ? `${referral.createdBy.firstName ?? ''} ${
        referral.createdBy.lastName ?? ''
      }`.trim()
    : 'Unknown';

  const dateStr = referral.createdAt
    ? new Date(referral.createdAt).toLocaleDateString()
    : '';

  const statusColor =
    referral.status === 'ACCEPTED'
      ? Colors.SUCCESS
      : referral.status === 'DECLINED'
        ? Colors.ERROR
        : Colors.WARNING;

  // TEMPORARY: split the human notes from the intake sidecar for display.
  const { humanNotes, intake } = decodeReferralNotes(referral.notes);
  const intakeSummary = summarizeIntake(intake); // PII masked

  return (
    <View style={styles.card} testID={`referral-card-${referral.id}`}>
      {/* date + status tags */}
      <View style={styles.cardTopRow}>
        <TextRegular size="sm" color={Colors.NEUTRAL}>
          {dateStr}
        </TextRegular>
        <TagRow
          tags={[{ label: referral.status ?? 'PENDING', color: statusColor }]}
        />
      </View>

      {/* shelter block, shared with the picker */}
      {referral.shelter ? (
        <ShelterCard
          id={referral.shelter.id}
          name={referral.shelter.name}
          place={referral.shelter.location?.place}
          attributes={shelterAttributeLabels(referral.shelter)}
          desiredAttributes={needLabelsFromIntake(intake)}
        />
      ) : (
        <TextBold size="sm">Unknown Shelter</TextBold>
      )}

      {/* referrer + notes */}
      <View style={styles.referrerRow}>
        <TextRegular size="sm" color={Colors.NEUTRAL_DARK}>
          Referrer:
        </TextRegular>
        {/* link to a worker/volunteer profile once such a screen exists */}
        <View style={styles.userChip}>
          <Avatar
            size="sm"
            accessibilityLabel={`${referrerName} profile photo`}
            accessibilityHint="referrer profile photo"
          />
          <TextRegular size="sm">{referrerName}</TextRegular>
        </View>
      </View>

      {humanNotes ? (
        <TextRegular size="sm" color={Colors.NEUTRAL_DARK}>
          Notes: {humanNotes}
        </TextRegular>
      ) : null}
      {intakeSummary ? (
        <TextRegular size="xs" color={Colors.NEUTRAL}>
          Intake (temporary): {intakeSummary}
        </TextRegular>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.WHITE,
    borderRadius: 8,
    padding: Spacings.md,
    marginBottom: Spacings.sm,
    gap: Spacings.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  referrerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
  },
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xxs,
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
    borderRadius: 100,
    paddingVertical: 2,
    paddingLeft: Spacings.xxs,
    paddingRight: Spacings.xs,
  },
});
