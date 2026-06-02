import { useMutation, useQuery } from '@apollo/client/react';
import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  IconButton,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSnackbar } from '../../../hooks';
import { useModalScreen } from '../../../providers';
import { pagePaddingHorizontal } from '../../../static';
import { ClientProfileQuery } from '../__generated__/Client.generated';
import { ReferralForm } from './ReferralForm';
import {
  ClientReferralsDocument,
  ClientReferralsQuery,
  CreateReferralDocument,
} from './__generated__/Referrals.generated';

type TProps = {
  client: ClientProfileQuery | undefined;
};

export function ReferralsTab({ client }: TProps) {
  const clientId = client?.clientProfile.id;
  const { showSnackbar } = useSnackbar();
  const { showModalScreen } = useModalScreen();

  const { data, loading, error, refetch } = useQuery<ClientReferralsQuery>(
    ClientReferralsDocument,
    {
      variables: { clientId },
      skip: !clientId,
    }
  );

  const [createReferral] = useMutation(CreateReferralDocument);

  if (!clientId) {
    throw new Error('Something went wrong. Please try again.');
  }

  const referrals = data?.referrals.results ?? [];
  const totalCount = data?.referrals.totalCount ?? 0;

  const onSubmit = async (
    shelterId: string,
    notes: string | undefined,
    closeForm: () => void
  ) => {
    try {
      const result = await createReferral({
        variables: {
          data: {
            clientProfile: clientId,
            shelter: shelterId,
            notes,
          },
        },
      });

      if (result.data?.createReferral.__typename === 'OperationInfo') {
        showSnackbar({
          message: 'Error creating referral. Please try again.',
          type: 'error',
        });
        return;
      }

      showSnackbar({
        message: 'Referral submitted successfully!',
        type: 'success',
      });

      closeForm();
      refetch();
    } catch (e) {
      showSnackbar({
        message: 'Error creating referral.',
        type: 'error',
      });
      console.error(e);
    }
  };

  function openReferralForm() {
    showModalScreen({
      presentation: 'fullScreenModal',
      renderContent: ({ close }) => (
        <ReferralForm
          onCancel={close}
          onSubmit={(shelterId, notes) => onSubmit(shelterId, notes, close)}
        />
      ),
      title: 'Refer to Shelter',
    });
  }

  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <TextRegular size="sm">
          {loading
            ? 'Loading...'
            : `Displaying ${referrals.length} of ${totalCount} referrals`}
        </TextRegular>
        <IconButton
          variant="secondary"
          borderColor={Colors.WHITE}
          accessibilityLabel="create new referral"
          accessibilityHint="opens referral form"
          onPress={openReferralForm}
        >
          <PlusIcon />
        </IconButton>
      </View>

      {/* Loading state */}
      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.PRIMARY} />
        </View>
      )}

      {/* Error state */}
      {error && (
        <View style={styles.centered}>
          <TextRegular color={Colors.ERROR}>
            Error loading referrals. Please try again.
          </TextRegular>
        </View>
      )}

      {/* Empty state */}
      {!loading && !error && referrals.length === 0 && (
        <View style={styles.emptyState}>
          <TextBold size="sm" color={Colors.NEUTRAL_DARK}>
            No referrals yet
          </TextBold>
          <TextRegular size="sm" color={Colors.NEUTRAL}>
            Tap + to refer this client to a shelter.
          </TextRegular>
        </View>
      )}

      {/* Referral list */}
      {!loading && referrals.length > 0 && (
        <ScrollView showsVerticalScrollIndicator={false}>
          {referrals.map((referral) => (
            <ReferralCard key={referral.id} referral={referral} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ── Referral Card ──────────────────────────────────────────────────────────
type ReferralCardProps = {
  referral: ClientReferralsQuery['referrals']['results'][number];
};

function ReferralCard({ referral }: ReferralCardProps) {
  const referrerName = referral.createdBy
    ? `${referral.createdBy.firstName ?? ''} ${referral.createdBy.lastName ?? ''}`.trim()
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

  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <TextBold size="sm">{referral.shelter?.name ?? 'Unknown Shelter'}</TextBold>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <TextRegular size="xs" color={Colors.WHITE}>
            {referral.status ?? 'PENDING'}
          </TextRegular>
        </View>
      </View>

      <TextRegular size="sm" color={Colors.NEUTRAL_DARK}>
        Referred by: {referrerName}
      </TextRegular>

      <TextRegular size="sm" color={Colors.NEUTRAL}>
        {dateStr}
      </TextRegular>

      {referral.notes ? (
        <TextRegular size="sm" color={Colors.NEUTRAL_DARK}>
          Notes: {referral.notes}
        </TextRegular>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
    paddingTop: Spacings.md,
    paddingHorizontal: pagePaddingHorizontal,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacings.xs,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacings.xl,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacings.xl,
    gap: Spacings.xs,
  },
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
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: Spacings.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
