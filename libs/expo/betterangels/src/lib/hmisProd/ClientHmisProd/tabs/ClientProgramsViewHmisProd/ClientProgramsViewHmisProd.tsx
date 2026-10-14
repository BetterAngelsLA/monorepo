import { Colors } from '@monorepo/expo/shared/static';
import { InfiniteList, TextRegular } from '@monorepo/expo/shared/ui-components';
import { pagePaddingHorizontal } from '../../../../static';
import { DebugRow } from '../../../components';
import { useClientProgramsHmisProd } from '../../../hooks';
import { ProgramCard } from './components';

const PROGRAMS_ERROR_TITLE = 'HMIS programs failed';

type TProps = {
  hmisClientId: string;
};

/**
 * Programs tab for the hmisProd demo — Clarity's client program enrollments
 * as plain read-only cards in Clarity's default ordering (newest start date
 * first). Not paginated yet: fetches the first page only.
 */
export function ClientProgramsViewHmisProd(props: TProps) {
  const { hmisClientId } = props;

  const { data, debugInfo, error, isFetching, isError, isRefetching, refetch } =
    useClientProgramsHmisProd(hmisClientId);

  const items = data?.items ?? [];
  const errorMessage = error instanceof Error ? error.message : undefined;

  return (
    <>
      <DebugRow
        debugInfo={debugInfo}
        testID="hmis-prod-programs-copy-debug-info"
        label="programs debug info"
      />

      <InfiniteList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderResultsHeader={null}
        renderItem={(item) => <ProgramCard item={item} />}
        loading={isFetching}
        error={isError}
        errorTitle={PROGRAMS_ERROR_TITLE}
        errorMessage={errorMessage}
        refreshing={isRefetching}
        onRefresh={refetch}
        hasMore={false}
        ListEmptyComponent={
          <TextRegular size="sm" color={Colors.NEUTRAL_DARK}>
            No programs found.
          </TextRegular>
        }
        style={{ paddingHorizontal: pagePaddingHorizontal }}
      />
    </>
  );
}
