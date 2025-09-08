import { Spacings } from '@monorepo/expo/shared/static';
import { ContentStyle, FlashList } from '@shopify/flash-list';
import { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { EmptyListView } from './EmptyListView';
import { ItemSeparator as DefaultItemSeparator } from './ItemSeparator';
import { LoadingListView } from './LoadingListView';
import { ResultsHeader } from './ResultsHeader';
import type { TInfiniteListProps } from './types';

export function InfiniteList<T>(props: TInfiniteListProps<T>) {
  const {
    style,
    contentContainerStyle,
    data,
    idKey,
    keyExtractor,
    renderItem,
    loadMore,
    loading,
    hasMore,
    totalItems,
    extraData,
    estimatedItemSize,
    ListEmptyComponent,
    ListFooterComponent,
    LoadingViewContent,
    onEndReachedThreshold = 0.05,
    renderResultsHeader,
    modelName,
    modelNamePlural,
    itemGap = Spacings.xs,
    showScrollIndicator = false,
    ItemSeparatorComponent,
    ...rest
  } = props;

  const keyExtractorStable = useCallback(
    (item: T, idx: number) => {
      if (keyExtractor) {
        return keyExtractor(item, idx);
      }

      // idKey exists if no keyExtractor
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return String(item[idKey!]);
    },
    [keyExtractor, idKey]
  );

  const renderItemStable = useCallback(
    ({ item }: { item: T }) => renderItem(item),
    [renderItem]
  );

  const onEndReached = useCallback(() => {
    if (!loading && hasMore && loadMore) {
      loadMore();
    }
  }, [loading, hasMore, loadMore]);

  const ItemSeparator = useMemo(() => {
    if (ItemSeparatorComponent) {
      return ItemSeparatorComponent;
    }

    return () => <DefaultItemSeparator height={itemGap} />;
  }, [ItemSeparatorComponent, itemGap]);

  const footerComponent = useMemo(() => {
    if (ListFooterComponent) {
      return ListFooterComponent;
    }

    if (loading) {
      return <LoadingListView content={LoadingViewContent} />;
    }

    // small footer helps ensure there’s space to hit the end
    return <View style={{ height: Spacings.sm }} />;
  }, [ListFooterComponent, loading, LoadingViewContent]);

  const emptyComponent = useMemo(() => {
    if (loading) {
      return null;
    }

    return ListEmptyComponent ?? <EmptyListView />;
  }, [loading, ListEmptyComponent]);

  const mergedContentContainerStyle: ContentStyle = useMemo(
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
      <ResultsHeader
        visibleCount={data.length}
        totalCount={totalItems}
        modelName={modelName}
        modelNamePlural={modelNamePlural}
        renderResultsHeader={renderResultsHeader}
        style={styles.resultsHeader}
      />

      <FlashList<T>
        estimatedItemSize={estimatedItemSize}
        data={data}
        keyExtractor={keyExtractorStable}
        renderItem={renderItemStable}
        onEndReached={onEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
        ItemSeparatorComponent={ItemSeparator}
        extraData={stableExtraData}
        ListEmptyComponent={emptyComponent}
        ListFooterComponent={footerComponent}
        contentContainerStyle={mergedContentContainerStyle}
        showsVerticalScrollIndicator={showScrollIndicator}
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
