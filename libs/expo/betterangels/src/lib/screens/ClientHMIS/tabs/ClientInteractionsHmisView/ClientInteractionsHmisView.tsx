import { useQuery } from '@apollo/client/react';
import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { IconButton, InfiniteList } from '@monorepo/expo/shared/ui-components';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { uniqueBy } from 'remeda';
import {
  HmisClientProfileType,
  HmisNoteType,
  Ordering,
} from '../../../../apollo';
import {
  MainScrollContainer,
  ProgramNoteCard,
} from '../../../../ui-components';
import { ListLoadingView } from './ListLoadingView';
import {
  HmisNotesDocument,
  HmisNotesQuery,
} from './__generated__/ClientInteractionsHmisView.generated';

const paginationLimit = 10;

type THmisNote = HmisNotesQuery['hmisNotes']['results'][number];

type TProps = { client?: HmisClientProfileType };

export function ClientInteractionsHmisView(props: TProps) {
  const { client } = props;
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const { data, loading, error } = useQuery(HmisNotesDocument, {
    skip: !client?.id,
    variables: {
      pagination: { limit: 10 + 1, offset: 0 },
      ordering: [{ date: Ordering.Desc }, { id: Ordering.Desc }],
      filters: { hmisClientProfile: client?.id },
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });
  console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
  console.log(data);
  const [hmisNotes, setHmisNotes] = useState<
    HmisNotesQuery['hmisNotes']['results']
  >([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  console.log('#######################################');
  console.log(hmisNotes);

  function loadMoreHmisNotes() {
    if (hasMore && !loading) {
      setOffset((prevOffset) => prevOffset + paginationLimit);
    }
  }

  useEffect(() => {
    if (!data || !('hmisNotes' in data)) {
      return;
    }

    const { results, totalCount } = data.hmisNotes;
    setTotalCount(totalCount);

    if (offset === 0) {
      setHmisNotes(results);
    } else {
      setHmisNotes((prevNotes) =>
        uniqueBy([...prevNotes, ...results], (note) => note.id)
      );
    }

    setHasMore(offset + paginationLimit < totalCount);
  }, [data, offset]);

  const renderItemFn = useCallback(
    (item: THmisNote) => (
      <ProgramNoteCard
        onPress={() => {
          router.navigate({
            pathname: `/notes-hmis/${item.id}`,
            params: {
              clientHmisId: client?.hmisId,
            },
          });
        }}
        variant="clientProfile"
        hmisNote={item}
      />
    ),
    [client]
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
            router.navigate(
              `/notes-hmis/create?hmisClientId=${client.personalId}`
            )
          }
        >
          <PlusIcon />
        </IconButton>
      </View>
      <InfiniteList<HmisNoteType>
        data={hmisNotes || []}
        keyExtractor={(item) => item.id ?? ''}
        totalItems={totalCount}
        renderItem={renderItemFn}
        itemGap={Spacings.xs}
        loading={loading}
        loadMore={loadMoreHmisNotes}
        hasMore={hasMore}
        modelName="note"
        LoadingViewContent={<ListLoadingView style={{ paddingVertical: 40 }} />}
        error={!!error}
      />
    </MainScrollContainer>
  );
}
