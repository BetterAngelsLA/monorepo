import { useApolloClient } from '@apollo/client/react';
import { FocusedInfiniteList } from '../../../ui-components/InfiniteList/FocusedInfiniteList';
import { DraftCard } from './sessions/DraftCard';
import { ReferralCard, type ReferralCardProps } from './list/ReferralCard';
import { useActiveOrg, useApiConfig } from '@monorepo/ba-platform';
import { useUser } from '../../../providers/user/UserProvider';
import { useInfiniteScrollQuery } from '@monorepo/apollo';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { InfoIcon, PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  ActionModal,
  IconButton,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useModalScreen } from '../../../providers';
import { pagePaddingHorizontal } from '../../../static';
import { ClientProfileQuery } from '../__generated__/Client.generated';
import { ClientViewTabEnum } from '../ClientTabs';
import { useSnackbar } from '../../../hooks';
import { referralDraftSeed } from './intake/referralDraftSeed';
import { useReferralSubmission } from './useReferralSubmission';
import { useLocalDraftAction } from './sessions/useLocalDraftAction';
import { ReferralCreateFlow } from './ReferralCreateFlow';
import { DraftRecoveryNotice } from './sessions/DraftRecoveryNotice';
import {
  ReferralDraftProvider,
  useReferralDraft,
  useReferralDraftStore,
} from './sessions/ReferralDraftProvider';
import {
  ReferralPermissionsProvider,
  useReferralPermissions,
} from './ReferralPermissions';
import { ReferralsHelp } from './ReferralsHelp';
import type { ReferralDraftStore } from '../../../draft/referralDraft';
import {
  getPersistentReferralDraft,
  hasLegacyReferralDraft,
  recoverLegacyReferralDraft,
} from '../../../draft/referralDraftStorage';
import {
  ClientReferralsDocument,
  ClientReferralsQuery,
  ClientReferralsQueryVariables,
} from './__generated__/Referrals.generated';

// Client needs now come from the intake form, in the shelter's own vocabulary —
// see clientNeeds.ts. The picker reads the in-progress draft; a saved referral
// reads the answers stored on that referral, so a card always reflects the needs
// as they were recorded at the time rather than whatever is on screen now.

type TProps = {
  client: ClientProfileQuery | undefined;
  draftStore?: ReferralDraftStore;
};

export function ReferralsTab({ client, draftStore }: TProps) {
  if (!client) return <ActivityIndicator />;
  return (
    <ReferralPermissionsProvider>
      <ReferralGate>
        {!draftStore ? (
          <PersistentReferralsTab client={client} />
        ) : (
          <ReferralDraftProvider store={draftStore}>
            <ReferralsContent
              client={client}
              clientId={client.clientProfile.id}
            />
          </ReferralDraftProvider>
        )}
      </ReferralGate>
    </ReferralPermissionsProvider>
  );
}

/** The screen-level gate: hiding the tab is not enough for a deep link. */
function ReferralGate({ children }: { children: ReactNode }) {
  const { canView } = useReferralPermissions();
  if (!canView)
    return (
      <View style={styles.centered}>
        <TextRegular color={Colors.ERROR} accessibilityLiveRegion="polite">
          You do not have permission to view referrals.
        </TextRegular>
      </View>
    );
  return <>{children}</>;
}

function PersistentReferralsTab({ client }: Pick<TProps, 'client'>) {
  const { showSnackbar } = useSnackbar();
  const { user } = useUser();
  const { activeOrg } = useActiveOrg();
  const { apiUrl } = useApiConfig();
  const [, refresh] = useReducer((value: number) => value + 1, 0);
  const [recoverScope, setRecoverScope] = useState<string | null>(null);
  const clientId = client?.clientProfile.id;
  const currentScope = useRef('');
  const scopeIdentity = JSON.stringify([
    apiUrl,
    user?.id,
    activeOrg?.id,
    clientId,
  ]);
  useLayoutEffect(() => {
    currentScope.current = scopeIdentity;
    return () => {
      currentScope.current = '';
    };
  }, [scopeIdentity]);
  if (!user?.id || !activeOrg?.id || !clientId) return <ActivityIndicator />;
  const scope = {
    apiUrl,
    userId: user.id,
    organizationId: activeOrg.id,
    clientId,
  };
  const store = getPersistentReferralDraft(scope);
  return (
    <ReferralDraftProvider key={JSON.stringify(scope)} store={store}>
      {!store.getSnapshot() &&
        !store.getRecoveryState() &&
        hasLegacyReferralDraft(clientId) && (
          <Pressable
            accessibilityRole="button"
            onPress={() => setRecoverScope(scopeIdentity)}
          >
            <TextRegular>Recover older local draft</TextRegular>
          </Pressable>
        )}
      <ActionModal
        key={scopeIdentity}
        visible={recoverScope === scopeIdentity}
        setVisible={(visible) => {
          if (!visible) setRecoverScope(null);
        }}
        title="Recover an older draft?"
        body="An older app version saved a draft for this client without recording its account or environment. Recover it only if it belongs to your current work."
        primaryButtonTitle="Recover"
        secondaryButtonTitle="Cancel"
        onPrimaryPress={() => {
          setRecoverScope(null);
          if (currentScope.current !== scopeIdentity) return;
          try {
            recoverLegacyReferralDraft(scope);
          } catch {
            showSnackbar({
              message:
                'Could not finish recovering the older draft. Its saved answers have been kept. Check the draft shown here before trying again.',
              type: 'error',
            });
          }
          refresh();
        }}
      />
      <ReferralsContent client={client} clientId={clientId} />
    </ReferralDraftProvider>
  );
}

function ReferralsContent({
  client,
  clientId,
}: Pick<TProps, 'client'> & { clientId: string }) {
  const insets = useSafeAreaInsets();
  const store = useReferralDraftStore();
  const apolloClient = useApolloClient();
  const { showSnackbar } = useSnackbar();
  const runDraftAction = useLocalDraftAction();
  const modalSession = useRef<symbol | null>(null);
  const [pendingStart, setPendingStart] = useState<{
    existingId: string;
    begin: () => void;
  } | null>(null);
  const { showModalScreen } = useModalScreen();
  const [helpVisible, setHelpVisible] = useState(false);
  const router = useRouter();
  useEffect(
    () => () => {
      modalSession.current = null;
    },
    [],
  );

  const {
    items: referrals,
    total: totalCount,
    loading,
    error,
    reload,
    hasMore,
    loadMore,
    loadingMore,
    reloading,
  } = useInfiniteScrollQuery<
    ClientReferralsQuery['referrals']['results'][number],
    ClientReferralsQuery,
    ClientReferralsQueryVariables
  >({
    document: ClientReferralsDocument,
    queryFieldName: 'referrals',
    variables: { filters: { clientProfile: clientId } },
    pageSize: 25,
  });
  const handleSaved = useCallback(() => {
    apolloClient.cache.evict({ fieldName: 'referrals' });
    apolloClient.cache.gc();
    reload();
  }, [apolloClient, reload]);
  const submit = useReferralSubmission(store, handleSaved);
  const openReferralForm = useCallback(() => {
    const draftId = store.getSnapshot()?.id;
    if (!draftId) return;
    const session = Symbol();
    modalSession.current = session;
    showModalScreen({
      onClose: () => {
        if (modalSession.current === session) modalSession.current = null;
      },
      presentation: 'fullScreenModal',
      // in-form Cancel / Pause row is the single, consistent set of exits —
      // drop the redundant header "x" (keeps the "Refer to Shelter" title bar)
      header: { mode: 'custom', buttonRight: null },
      renderContent: ({ close }) => {
        const closeCurrent = () => {
          if (modalSession.current !== session) return;
          modalSession.current = null;
          close();
        };
        return (
          <ReferralDraftProvider store={store}>
            <DraftModal draftId={draftId} onClose={closeCurrent}>
              <ReferralCreateFlow
                clientId={clientId}
                onCancel={() => {
                  if (runDraftAction(() => store.clear(draftId)))
                    closeCurrent();
                }}
                onPause={() => {
                  closeCurrent();
                  if (store.getSnapshot()?.submission.status === 'uncertain')
                    reload();
                }}
                onSubmit={() =>
                  modalSession.current === session
                    ? submit(draftId)
                    : Promise.resolve(false)
                }
                profile={client?.clientProfile}
                onEditProfile={() => {
                  closeCurrent();
                  router.navigate({
                    pathname: `/client/${clientId}`,
                    params: { newTab: ClientViewTabEnum.Profile },
                  });
                }}
              />
            </DraftModal>
          </ReferralDraftProvider>
        );
      },
      title:
        store.getSnapshot()?.source?.kind === 'edit'
          ? 'Edit Referral'
          : 'Refer to Shelter',
    });
  }, [
    client,
    clientId,
    reload,
    router,
    runDraftAction,
    showModalScreen,
    store,
    submit,
  ]);

  const startNewReferral = () => {
    if (runDraftAction(() => store.startNew(clientId))) openReferralForm();
  };

  const startFromReferral = useCallback(
    (
      referral: ReferralCardProps['referral'],
      mode: 'edit' | 'reuse',
    ) => {
      if (store.getRecoveryState()) {
        showSnackbar({
          message: 'Resolve the unreadable local draft before starting another.',
          type: 'error',
        });
        return;
      }
      const seed = referralDraftSeed(referral, mode);
      if (!seed) {
        showSnackbar({
          message:
            'This referral contains information this app version cannot read. Its saved information has been left intact.',
          type: 'error',
        });
        return;
      }
      const begin = () => {
        if (runDraftAction(() => store.startNew(clientId, seed)))
          openReferralForm();
      };
      const existing = store.getSnapshot();
      if (!existing) {
        begin();
        return;
      }
      if (existing.submission.status !== 'idle') {
        openReferralForm();
        return;
      }
      setPendingStart({ existingId: existing.id, begin });
    },
    [clientId, openReferralForm, runDraftAction, showSnackbar, store],
  );

  const handleEdit = useCallback(
    (referral: ReferralCardProps['referral']) =>
      startFromReferral(referral, 'edit'),
    [startFromReferral],
  );
  const handleReuse = useCallback(
    (referral: ReferralCardProps['referral']) =>
      startFromReferral(referral, 'reuse'),
    [startFromReferral],
  );

  const confirmDiscardDraft = () => {
    const current = store.getSnapshot();
    if (current && current.submission.status !== 'pending')
      runDraftAction(() => store.clear(current.id));
  };

  return (
    <View
      style={[styles.container, { paddingBottom: insets.bottom }]}
      testID="referrals-screen"
    >
      <DraftRecoveryNotice />
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
        <DraftHeaderActions
          clientId={clientId}
          onResume={openReferralForm}
          onCreate={startNewReferral}
        />
      </View>

      {/* Loading state */}
      {loading && (
        <View style={styles.centered} testID="referrals-loading">
          <ActivityIndicator size="large" color={Colors.PRIMARY} />
        </View>
      )}

      {/* Error state */}
      {error && (
        <View style={styles.centered}>
          <TextRegular color={Colors.ERROR}>
            Error loading referrals. Please try again.
          </TextRegular>
          <Pressable accessibilityRole="button" onPress={reload}>
            <TextBold>Retry</TextBold>
          </Pressable>
        </View>
      )}

      {/* Referral list — the draft rides at the top of the list (not pinned) so
          it scrolls away and doesn't eat the history's vertical space. The
          header's Resume button stays pinned, so resuming is always one tap. */}
      {!loading && (
        <FocusedInfiniteList<
          ClientReferralsQuery['referrals']['results'][number]
        >
          data={referrals}
          keyExtractor={(referral) => referral.id}
          renderItem={(referral) => (
            <ReferralCard
              referral={referral}
              profile={client?.clientProfile}
              clientName={[
                client?.clientProfile.firstName,
                client?.clientProfile.lastName,
              ]
                .filter(Boolean)
                .join(' ')}
              onEdit={handleEdit}
              onReferAgain={handleReuse}
            />
          )}
          totalItems={totalCount}
          renderResultsHeader={null}
          loadMore={loadMore}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onRefresh={reload}
          refreshing={reloading}
          itemGap={0}
          ListHeaderComponent={
            <DraftListHeader
              clientId={clientId}
              onResume={openReferralForm}
              onDiscard={confirmDiscardDraft}
            />
          }
          ListEmptyComponent={
            error ? <NoListItems /> : <EmptyReferralList clientId={clientId} />
          }
        />
      )}

      <ReferralsHelp
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
      />
      <ActionModal
        visible={!!pendingStart}
        setVisible={(visible) => {
          if (!visible) setPendingStart(null);
        }}
        title="A draft already exists for this client"
        body="Resume it, or discard it to start from the selected referral."
        primaryButtonTitle="Resume draft"
        secondaryButtonTitle="Cancel"
        tertiaryButtonTitle="Discard and start"
        onPrimaryPress={() => {
          setPendingStart(null);
          openReferralForm();
        }}
        onSecondaryPress={() => setPendingStart(null)}
        onTertiaryPress={() => {
          const pending = pendingStart;
          setPendingStart(null);
          if (!pending) return;
          // Replace in one persisted write: failure must retain the old draft.
          const current = store.getSnapshot();
          if (
            current?.id === pending.existingId &&
            current.submission.status === 'idle'
          )
            pending.begin();
        }}
      />
    </View>
  );
}

function DraftModal({
  draftId,
  onClose,
  children,
}: {
  draftId: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const { draft } = useReferralDraft();
  useEffect(() => {
    if (!draft || draft.id !== draftId) onClose();
  }, [draft, draftId, onClose]);
  return draft?.id === draftId ? children : null;
}

const NoListItems = () => null;

// Only draft-dependent controls subscribe. Saved-history parsing/matching and
// the paginated list remain untouched when an answer changes in the modal.
function DraftHeaderActions({
  clientId,
  onResume,
  onCreate,
}: {
  clientId: string;
  onResume: () => void;
  onCreate: () => void;
}) {
  const { draft, recovery } = useReferralDraft();
  const { canCreate } = useReferralPermissions();
  if (draft?.clientId === clientId) {
    return (
      <Pressable
        testID="resume-referral-btn"
        onPress={onResume}
        style={styles.resumeBtn}
        accessibilityRole="button"
        accessibilityLabel="resume referral draft"
        accessibilityHint="reopens your in-progress referral"
      >
        <TextBold size="sm" color={Colors.PRIMARY}>
          Resume
        </TextBold>
      </Pressable>
    );
  }
  if (recovery || !canCreate) return null;
  return (
    <IconButton
      testID="create-referral-btn"
      variant="secondary"
      borderColor={Colors.WHITE}
      accessibilityLabel="create new referral"
      accessibilityHint="opens referral form"
      onPress={onCreate}
    >
      <PlusIcon />
    </IconButton>
  );
}

function DraftListHeader({
  clientId,
  onResume,
  onDiscard,
}: {
  clientId: string;
  onResume: () => void;
  onDiscard: () => void;
}) {
  const { draft } = useReferralDraft();
  if (!draft || draft.clientId !== clientId) return null;
  return (
    <DraftCard
      updatedAt={draft.updatedAt}
      requestedArrivalDate={draft.answers.requestedArrivalDate}
      status={draft.submission.status}
      onResume={onResume}
      onDiscard={onDiscard}
    />
  );
}

function EmptyReferralList({ clientId }: { clientId: string }) {
  const { draft, recovery } = useReferralDraft();
  if (draft?.clientId === clientId || recovery) return null;
  return (
    <View style={styles.emptyState}>
      <TextBold size="sm" color={Colors.NEUTRAL_DARK}>
        No referrals yet
      </TextBold>
      <TextRegular size="sm" color={Colors.NEUTRAL}>
        Tap + to refer this client to a shelter.
      </TextRegular>
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
