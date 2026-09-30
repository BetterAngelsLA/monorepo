import { Colors } from '@monorepo/expo/shared/static';
import { InfiniteList, TextRegular } from '@monorepo/expo/shared/ui-components';
import { pagePaddingHorizontal } from '../../../../static';
import { DebugRow } from '../../../components';
import { useClientHistoryHmisProd } from '../../../hooks';
import { HistoryCard } from './components';

const HISTORY_ERROR_TITLE = 'HMIS history failed';

type TProps = {
  hmisClientId: string;
};

/**
 * History tab for the hmisProd demo — Clarity's client history entries
 * (demographic / service / program) as plain read-only cards in Clarity's
 * default ordering. Not paginated yet: fetches the first page only.
 */
export function ClientHistoryViewHmisProd(props: TProps) {
  const { hmisClientId } = props;

  const { data, debugInfo, error, isFetching, isError, isRefetching, refetch } =
    useClientHistoryHmisProd(hmisClientId);

  const items = data?.items ?? [];
  const errorMessage = error instanceof Error ? error.message : undefined;

  return (
    <>
      <DebugRow
        debugInfo={debugInfo}
        testID="hmis-prod-history-copy-debug-info"
        label="history debug info"
      />

      <InfiniteList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderResultsHeader={null}
        renderItem={(item) => <HistoryCard item={item} />}
        loading={isFetching}
        error={isError}
        errorTitle={HISTORY_ERROR_TITLE}
        errorMessage={errorMessage}
        refreshing={isRefetching}
        onRefresh={refetch}
        hasMore={false}
        ListEmptyComponent={
          <TextRegular size="sm" color={Colors.NEUTRAL_DARK}>
            No history found.
          </TextRegular>
        }
        style={{ paddingHorizontal: pagePaddingHorizontal }}
      />
    </>
  );
}
