import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { memo, useMemo } from 'react';
import {
  Avatar,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { Pressable, StyleSheet, View } from 'react-native';
import { ReferralShare } from '../share/ReferralShare';
import { ClientReferralsQuery } from '../__generated__/Referrals.generated';
import { ShelterCard, TagRow } from '../shelter/ShelterCard';
import { needLabelsFromIntake } from '../shared/clientNeeds';
import { decodeReferralNotes, summarizeIntake } from '../shared/referralIntakeSidecar';
import { shelterAttributeLabels } from '../shared/shelterAttributes';
import { formatReferralDate } from '../shared/referralPresentation';
import type { ProfileCardData } from '../shared/referralProfile';
import { RequestedArrivalDate } from './RequestedArrivalDate';
import { useReferralPermissions } from '../ReferralPermissions';

// A card reads the intake answers stored on the referral (in the shelter's own
// vocabulary — see clientNeeds.ts), so it reflects the needs as they were
// recorded at the time rather than whatever is on screen now.

type Referral = ClientReferralsQuery['referrals']['results'][number];

export type ReferralCardProps = {
  referral: Referral;
  clientName: string;
  profile?: ProfileCardData | null;
  onEdit: (referral: Referral) => void;
  onReferAgain: (referral: Referral) => void;
};

export const ReferralCard = memo(function ReferralCard({
  referral,
  clientName,
  profile,
  onEdit,
  onReferAgain,
}: ReferralCardProps) {
  const { canChange, canCreate } = useReferralPermissions();
  const referrerName = referral.createdBy
    ? `${referral.createdBy.firstName ?? ''} ${
        referral.createdBy.lastName ?? ''
      }`.trim()
    : 'Unknown';

  const dateStr = formatReferralDate(referral.createdAt);

  const statusColor =
    referral.status === 'ACCEPTED'
      ? Colors.SUCCESS
      : referral.status === 'DECLINED'
        ? Colors.ERROR
        : Colors.WARNING;

  // TEMPORARY: split the human notes from the intake sidecar for display.
  // Decoding parses JSON, so keep it tied to the saved notes rather than to
  // every render (the list re-renders on refresh and modal changes).
  const decoded = useMemo(
    () => decodeReferralNotes(referral.notes),
    [referral.notes],
  );
  const { humanNotes } = decoded;
  const requestedArrivalDate = decoded.intake.requestedArrivalDate;
  const intakeSummary = useMemo(() => {
    const { requestedArrivalDate: _arrival, ...otherIntake } = decoded.intake;
    return summarizeIntake(otherIntake); // PII masked
  }, [decoded]);
  const attributes = useMemo(
    () => (referral.shelter ? shelterAttributeLabels(referral.shelter) : []),
    [referral.shelter],
  );
  const desiredAttributes = useMemo(
    () => needLabelsFromIntake(decoded.intake),
    [decoded],
  );

  return (
    <View style={styles.card} testID={`referral-card-${referral.id}`}>
      {/* date + status tags */}
      <View style={styles.cardTopRow}>
        <TextRegular size="sm" color={Colors.NEUTRAL}>
          Referred: {dateStr || 'Not recorded'}
        </TextRegular>
        <TagRow
          tags={[{ label: referral.status ?? 'PENDING', color: statusColor }]}
        />
      </View>

      <RequestedArrivalDate value={requestedArrivalDate} />

      {/* shelter block, shared with the picker */}
      {referral.shelter ? (
        <ShelterCard
          id={referral.shelter.id}
          name={referral.shelter.name}
          place={referral.shelter.location?.place}
          attributes={attributes}
          desiredAttributes={desiredAttributes}
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
      {(canChange || canCreate) && (
        <View style={styles.cardTopRow}>
          {canChange && (
            <Pressable
              testID={`edit-referral-${referral.id}`}
              accessibilityRole="button"
              onPress={() => onEdit(referral)}
            >
              <TextBold color={Colors.PRIMARY}>Edit referral</TextBold>
            </Pressable>
          )}
          {canCreate && (
            <Pressable
              testID={`reuse-referral-${referral.id}`}
              accessibilityRole="button"
              onPress={() => onReferAgain(referral)}
            >
              <TextBold color={Colors.PRIMARY}>
                Refer to another shelter
              </TextBold>
            </Pressable>
          )}
        </View>
      )}
      {intakeSummary ? (
        <TextRegular size="xs" color={Colors.NEUTRAL}>
          Intake (temporary): {intakeSummary}
        </TextRegular>
      ) : null}
      <ReferralShare
        referral={referral}
        clientName={clientName}
        profile={profile}
      />
    </View>
  );
});

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
