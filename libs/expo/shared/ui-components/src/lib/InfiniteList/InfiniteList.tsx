import { Spacings } from '@monorepo/expo/shared/static';
import {
  FlashList,
  type FlashListRef,
  type ViewToken,
} from '@shopify/flash-list';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { EmptyListView } from './EmptyListView';
import { ErrorListView } from './ErrorListView';
import { ItemSeparator as DefaultItemSeparator } from './ItemSeparator';
import { LoadingListView } from './LoadingListView';
import { ResultsHeader } from './ResultsHeader';
import type { TInfiniteListProps } from './types';

// The last row counts as viewable as soon as any part of it is on screen.
//
// `minimumViewTime: 0` is load bearing: FlashList's 250ms default only reports
// an index set if it is still on screen when the timer fires, so a quick flick
// past the end would never report.
//
// Module scope on purpose: FlashList builds its `ViewabilityHelper` once.
const PAGING_VIEWABILITY_CONFIG = {
  itemVisiblePercentThreshold: 0,
  minimumViewTime: 0,
};

export function InfiniteList<T>(props: TInfiniteListProps<T>) {
  const {
    style,
    contentContainerStyle,
    data,
    error,
    errorTitle,
    errorMessage,
    keyExtractor,
    renderItem,
    loadMore,
    loading,
    loadingMore,
    refreshing,
    hasMore,
    totalItems,
    extraData,
    ListEmptyComponent,
    ListFooterComponent,
    loadingViewOptions,
    renderResultsHeader,
    modelName,
    modelNamePlural,
    itemGap = Spacings.xs,
    showScrollIndicator = false,
    ItemSeparatorComponent,
    ErrorViewComponent,
    onRefresh,
    scrollResetKey,
    viewabilityConfigCallbackPairs,
    ...rest
  } = props;

  const isAnyLoading = loading || loadingMore || refreshing;

  const listRef = useRef<FlashListRef<T> | null>(null);

  // Reset to the top so a shorter result set never leaves the viewport past
  // its content (BACS-123).
  useEffect(() => {
    if (scrollResetKey === undefined) return;

    listRef.current?.scrollToTop({ animated: false });
  }, [scrollResetKey]);

  const renderItemStable = useCallback(
    ({ item }: { item: T }) => renderItem(item),
    [renderItem],
  );

  // Not `onEndReached`: that is a level signal, re-checked after every commit,
  // whose `pendingEndReached` latch FlashList clears whenever `data` changes
  // (`useBoundDetection`) — so the page that lands re-arms it. Viewability is per
  // row (`ViewabilityHelper.isItemViewable`) and true once per arrival, which is
  // the question this call site is asking.
  const lastIndex = data.length - 1;

  const pagingPair = {
    viewabilityConfig: PAGING_VIEWABILITY_CONFIG,
    onViewableItemsChanged: ({
      viewableItems,
    }: {
      viewableItems: ViewToken<T>[];
    }) => {
      if (isAnyLoading || !hasMore || !loadMore) return;
      if (!viewableItems.some((token) => token.index === lastIndex)) return;

      loadMore();
    },
  };

  const ItemSeparator = useMemo(() => {
    if (ItemSeparatorComponent) {
      return ItemSeparatorComponent;
    }

    return () => <DefaultItemSeparator height={itemGap} />;
  }, [ItemSeparatorComponent, itemGap]);

  const FooterComponent = useMemo(() => {
    if (ListFooterComponent) {
      return ListFooterComponent;
    }

    // refresh has separate indicator
    if (loading || loadingMore) {
      return <LoadingListView {...loadingViewOptions} />;
    }

    // small footer helps ensure there’s space to hit the end
    return <View style={{ height: Spacings.sm }} />;
  }, [ListFooterComponent, loading, loadingMore, loadingViewOptions]);

  const ErrorView = useMemo(() => {
    if (ErrorViewComponent) {
      return ErrorViewComponent;
    }

    return <ErrorListView title={errorTitle} bodyText={errorMessage} />;
  }, [errorTitle, errorMessage, ErrorViewComponent]);

  const EmptyView = useMemo(() => {
    if (isAnyLoading) {
      return null;
    }

    if (error) {
      return ErrorView;
    }

    return ListEmptyComponent ?? <EmptyListView />;
  }, [isAnyLoading, error, ListEmptyComponent, ErrorView]);

  const mergedContentContainerStyle = useMemo(
    () => StyleSheet.flatten([styles.contentContainer, contentContainerStyle]),
    [contentContainerStyle],
  );

  // Stable extraData to re-render FlashList as needed
  const stableExtraData = useMemo(
    () => [data.length, itemGap, extraData],
    [data.length, itemGap, extraData],
  );

  return (
    <View style={[styles.container, style]}>
      {!error && (
        <ResultsHeader
          visibleCount={data.length}
          totalCount={totalItems}
          modelName={modelName}
          modelNamePlural={modelNamePlural}
          renderResultsHeader={renderResultsHeader}
          style={styles.resultsHeader}
        />
      )}

      <FlashList<T>
        ref={listRef}
        data={data}
        renderItem={renderItemStable}
        viewabilityConfigCallbackPairs={[
          pagingPair,
          ...(viewabilityConfigCallbackPairs ?? []),
        ]}
        ItemSeparatorComponent={ItemSeparator}
        extraData={stableExtraData}
        ListEmptyComponent={EmptyView}
        ListFooterComponent={FooterComponent}
        contentContainerStyle={mergedContentContainerStyle}
        showsVerticalScrollIndicator={showScrollIndicator}
        onRefresh={onRefresh}
        refreshing={refreshing}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { paddingBottom: 60 },
  resultsHeader: { marginBottom: Spacings.xs },
});
