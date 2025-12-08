import { useInfiniteScrollQuery } from '@monorepo/apollo';
import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { IconButton, InfiniteList } from '@monorepo/expo/shared/ui-components';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { View } from 'react-native';
import { HmisClientProfileType, HmisNoteType } from '../../../../apollo';
import {
  MainScrollContainer,
  ProgramNoteCard,
} from '../../../../ui-components';
import {
  HmisNotesDocument,
  HmisNotesQuery,
  HmisNotesQueryVariables,
} from './__generated__/ClientInteractionsHmisView.generated';
import { DEFAULT_PAGINATION_LIMIT } from './constants';

type TProps = { client?: HmisClientProfileType };

export function ClientInteractionsHmisView(props: TProps) {
  const { client } = props;
  const { items, total, loading, hasMore, loadMore, error } =
    useInfiniteScrollQuery<
      HmisNoteType,
      HmisNotesQuery,
      HmisNotesQueryVariables
    >({
      document: HmisNotesDocument,
      queryFieldName: 'hmisNotes',
      pageSize: DEFAULT_PAGINATION_LIMIT,
      variables: { filters: { hmisClientProfile: client?.id } },
      fetchPolicy: 'cache-and-network',
      nextFetchPolicy: 'cache-first',
    });
  if (error) {
    console.error(error);
  }

  const renderItemFn = useCallback(
    (item: HmisNoteType) => (
      <ProgramNoteCard
        onPress={() => {
          router.navigate({
            pathname: `/notes-hmis/${item.id}`,
            params: { clientId: client?.id },
          });
        }}
        variant="clientProfile"
        hmisNote={item}
      />
    ),
    []
  );

  if (!client) {
    return null;
  }

  return (
    <MainScrollContainer bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <View style={{ marginBottom: Spacings.md }}>
        <IconButton
          variant="secondary"
          borderColor={Colors.WHITE}
          accessibilityLabel="create an interaction"
          accessibilityHint="create new interaction"
          onPress={() =>
            router.navigate(`/notes-hmis/create?clientId=${client.id}`)
          }
        >
          <PlusIcon />
        </IconButton>
      </View>
      <InfiniteList<HmisNoteType>
        data={items}
        keyExtractor={(item) => item.id ?? ''}
        totalItems={total}
        renderItem={renderItemFn}
        renderResultsHeader={null}
        loading={loading}
        loadMore={loadMore}
        hasMore={hasMore}
        modelName="note"
        error={!!error}
      />
    </MainScrollContainer>
  );
}
