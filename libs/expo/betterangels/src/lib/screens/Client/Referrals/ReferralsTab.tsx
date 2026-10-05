import { useMutation } from '@apollo/client/react';
import { useInfiniteScrollQuery } from '@monorepo/apollo';
import { useRouter } from 'expo-router';
import { InfoIcon, PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  IconButton,
  InfiniteList,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import {
  OperationMessageKind,
  extractOperationInfoMessages,
} from '../../../apollo';
import { useSnackbar } from '../../../hooks';
import { useModalScreen } from '../../../providers';
import { pagePaddingHorizontal } from '../../../static';
import { ClientProfileQuery } from '../__generated__/Client.generated';
import { ClientViewTabEnum } from '../ClientTabs';
import { DraftCard } from './DraftCard';
import { ReferralCard } from './ReferralCard';
import { ReferralCreateFlow } from './ReferralCreateFlow';
import {
  ReferralDraftProvider,
  useReferralDraft,
} from './ReferralDraftProvider';
import { ReferralsHelp } from './ReferralsHelp';
import type { ReferralDraftStore } from './referralDraft';
import { getPersistentReferralDraft } from './referralDraftStorage';
import { REFERRALS_PAGE_SIZE } from './constants';
import {
  ClientReferralsDocument,
  ClientReferralsQuery,
  ClientReferralsQueryVariables,
  CreateReferralDocument,
} from './__generated__/Referrals.generated';

type TProps = {
  client: ClientProfileQuery | undefined;
  draftStore?: ReferralDraftStore;
};

export function ReferralsTab({ client, draftStore }: TProps) {
  const clientId = client?.clientProfile.id;
  if (!clientId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return (
    <ReferralDraftProvider store={draftStore ?? getPersistentReferralDraft()}>
      <ReferralsContent client={client} clientId={clientId} />
    </ReferralDraftProvider>
  );
}

type TContentProps = {
  client: ClientProfileQuery | undefined;
  clientId: string;
};

function ReferralsContent({ client, clientId }: TContentProps) {
  const { draft, store } = useReferralDraft();
  const { showSnackbar } = useSnackbar();
  const { showModalScreen } = useModalScreen();
  const [helpVisible, setHelpVisible] = useState(false);
  const router = useRouter();

  const {
    items: referrals,
    total,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    reload,
  } = useInfiniteScrollQuery<
    ClientReferralsQuery['referrals']['results'][number],
    ClientReferralsQuery,
    ClientReferralsQueryVariables
  >({
    document: ClientReferralsDocument,
    queryFieldName: 'referrals',
    variables: { filters: { clientProfile: clientId } },
    pageSize: REFERRALS_PAGE_SIZE,
  });

  const [createReferral] = useMutation(CreateReferralDocument);

  const hasDraft = draft?.clientId === clientId;
  const totalCount = total ?? 0;

  const onSubmit = async (
    shelterId: string,
    notes: string | undefined,
    closeForm: () => void,
  ): Promise<boolean> => {
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

      const referral = result.data?.createReferral;
      if (referral?.__typename === 'OperationInfo') {
        const operationErrors = extractOperationInfoMessages(
          result,
          'createReferral',
          [
            OperationMessageKind.Error,
            OperationMessageKind.Validation,
            OperationMessageKind.Permission,
          ],
        );

        showSnackbar({
          message: operationErrors?.length
            ? operationErrors.map((e) => e.message).join(', ')
            : 'Error creating referral. Please try again.',
          type: 'error',
        });
        return false;
      }

      // A missing payload does not confirm creation. Keep the draft available
      // until the server returns an identifiable referral.
      if (referral?.__typename !== 'ReferralType' || !referral.id) {
        showSnackbar({
          message: 'Error creating referral. Please try again.',
          type: 'error',
        });
        return false;
      }

      showSnackbar({
        message: 'Referral submitted successfully!',
        type: 'success',
      });

      store.clear();
      closeForm();
      reload();
      return true;
    } catch (e) {
      showSnackbar({
        message: 'Error creating referral. Please try again.',
        type: 'error',
      });
      console.error(e);
      return false;
    }
  };

  const openReferralForm = () => {
    showModalScreen({
      presentation: 'fullScreenModal',
      // in-form Cancel / Pause row is the single, consistent set of exits —
      // drop the redundant header "x" (keeps the "Refer to Shelter" title bar)
      header: { mode: 'custom', buttonRight: null },
      renderContent: ({ close }) => (
        <ReferralDraftProvider store={store}>
          <ReferralCreateFlow
            clientId={clientId}
            onCancel={() => {
              store.clear();
              close();
            }}
            onPause={close}
            onSubmit={(shelterId, notes) => onSubmit(shelterId, notes, close)}
            profile={client?.clientProfile}
            onEditProfile={() => {
              // Open the full profile VIEW (Profile tab) so any section is editable,
              // not just Personal Info. The draft is saved on-device and returns as
              // a resumable card in the referral list.
              close();
              router.navigate({
                pathname: `/client/${clientId}`,
                params: { newTab: ClientViewTabEnum.Profile },
              });
            }}
          />
        </ReferralDraftProvider>
      ),
      title: 'Refer to Shelter',
    });
  };

  const beginNewReferral = () => {
    store.startNew(clientId);
    openReferralForm();
  };

  const startNewReferral = () => {
    // The device keeps a single draft. Starting a new one for another client
    // silently replaced the old draft before, so confirm first.
    const current = store.getSnapshot();
    if (current && current.clientId !== clientId) {
      Alert.alert(
        'Replace the in-progress referral?',
        'You have an unsent referral for another client. Starting a new one will replace it.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Replace', style: 'destructive', onPress: beginNewReferral },
        ],
      );
      return;
    }

    beginNewReferral();
  };

  return (
    <View style={styles.container} testID="referrals-screen">
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={styles.headerCount}>
          <TextRegular size="sm">
            {loading
              ? 'Loading...'
              : `Displaying ${referrals.length} of ${totalCount} referrals`}
          </TextRegular>
          <Pressable
            testID="referrals-help-btn"
            onPress={() => setHelpVisible(true)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="about this list"
            accessibilityHint="explains the list and what the attribute tag colors mean"
          >
            <InfoIcon size="md" color={Colors.PRIMARY} />
          </Pressable>
        </View>
        {hasDraft ? (
          <Pressable
            testID="resume-referral-btn"
            onPress={openReferralForm}
            style={styles.resumeBtn}
            accessibilityRole="button"
            accessibilityLabel="resume referral draft"
            accessibilityHint="reopens your in-progress referral"
          >
            <TextBold size="sm" color={Colors.PRIMARY}>
              Resume
            </TextBold>
          </Pressable>
        ) : (
          <IconButton
            testID="create-referral-btn"
            variant="secondary"
            borderColor={Colors.WHITE}
            accessibilityLabel="create new referral"
            accessibilityHint="opens referral form"
            onPress={startNewReferral}
          >
            <PlusIcon />
          </IconButton>
        )}
      </View>

      {/* Loading state */}
      {loading && (
        <View style={styles.centered} testID="referrals-loading">
          <ActivityIndicator size="large" color={Colors.PRIMARY} />
        </View>
      )}

      {/* Error state */}
      {error && referrals.length === 0 && (
        <View style={styles.centered}>
          <TextRegular color={Colors.ERROR}>
            Error loading referrals. Please try again.
          </TextRegular>
        </View>
      )}

      {/* Empty state */}
      {!loading && !error && referrals.length === 0 && !hasDraft && (
        <View style={styles.emptyState}>
          <TextBold size="sm" color={Colors.NEUTRAL_DARK}>
            No referrals yet
          </TextBold>
          <TextRegular size="sm" color={Colors.NEUTRAL}>
            Tap + to refer this client to a shelter.
          </TextRegular>
        </View>
      )}

      {/* Referral list — the draft rides at the top of the list (not pinned) so
          it scrolls away and doesn't eat the history's vertical space. The
          header's Resume button stays pinned, so resuming is always one tap. */}
      {!loading && (hasDraft || referrals.length > 0) && (
        <InfiniteList<ClientReferralsQuery['referrals']['results'][number]>
          data={referrals}
          keyExtractor={(referral) => referral.id}
          renderItem={(referral) => <ReferralCard referral={referral} />}
          totalItems={totalCount}
          renderResultsHeader={null}
          loadMore={loadMore}
          hasMore={hasMore}
          loadingMore={loadingMore}
          itemGap={0}
          ListHeaderComponent={
            hasDraft ? (
              <DraftCard
                updatedAt={draft?.updatedAt}
                onResume={openReferralForm}
                onDiscard={() => store.clear()}
              />
            ) : null
          }
          // The draft card already explains the state when only a draft exists.
          ListEmptyComponent={hasDraft ? NoListItems : undefined}
        />
      )}

      <ReferralsHelp
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
      />
    </View>
  );
}

// When only a draft exists the draft card above already explains the state, so
// the list itself renders nothing.
const NoListItems = () => null;

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
  headerCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
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
  resumeBtn: {
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
    borderRadius: 8,
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.xxs,
  },
});
