import { Spacings } from '@monorepo/expo/shared/static';
import { FlashList } from '@shopify/flash-list';
import { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { EmptyListView } from './EmptyListView';
import { ErrorListView } from './ErrorListView';
import { ItemSeparator as DefaultItemSeparator } from './ItemSeparator';
import { LoadingListView } from './LoadingListView';
import { ResultsHeader } from './ResultsHeader';
import type { TInfiniteListProps } from './types';

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
    onEndReachedThreshold = 0.05,
    renderResultsHeader,
    modelName,
    modelNamePlural,
    itemGap = Spacings.xs,
    showScrollIndicator = false,
    ItemSeparatorComponent,
    ErrorViewComponent,
    onRefresh,
    ...rest
  } = props;

  const isAnyLoading = loading || loadingMore || refreshing;

  const renderItemStable = useCallback(
    ({ item }: { item: T }) => renderItem(item),
    [renderItem]
  );

  const onEndReached = useCallback(() => {
    if (!isAnyLoading && hasMore && loadMore) {
      loadMore();
    }
  }, [isAnyLoading, hasMore, loadMore]);

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
    [contentContainerStyle]
  );

  // Stable extraData to re-render FlashList as needed
  const stableExtraData = useMemo(
    () => [data.length, itemGap, extraData],
    [data.length, itemGap, extraData]
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
        data={data}
        renderItem={renderItemStable}
        onEndReached={onEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
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
