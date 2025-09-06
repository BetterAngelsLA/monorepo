import { Spacings } from '@monorepo/expo/shared/static';
import {
  ContentStyle,
  FlashList,
  type FlashListProps,
} from '@shopify/flash-list';
import { ReactElement, ReactNode, useCallback, useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { EmptyListView } from './EmptyListView';
import { ListLoadingView } from './ListLoadingView';
import { ResultsHeader, TRenderResultsHeader } from './ResultsHeader';

type TExtraFlashListProps<T> = Omit<
  Partial<FlashListProps<T>>,
  | 'data'
  | 'renderItem'
  | 'keyExtractor'
  | 'ListEmptyComponent'
  | 'ListFooterComponent'
  | 'ItemSeparatorComponent'
  | 'onEndReached'
  | 'onEndReachedThreshold'
>;

export interface InfiniteListProps<T, K extends keyof T = keyof T>
  extends TExtraFlashListProps<T> {
  style?: StyleProp<ViewStyle>;
  data: T[];
  idKey: K;
  renderItem: (item: T) => ReactElement | null;
  estimatedItemSize?: number; // rendering optimization. see console message if undefined
  loadMore?: () => void;
  loading?: boolean;
  hasMore?: boolean;
  itemGap?: number;
  totalItems?: number;
  renderResultsHeader?: TRenderResultsHeader | null;
  ListEmptyComponent?: ReactElement | null;
  ListFooterComponent?: ReactElement | null;
  LoadingViewContent?: ReactNode | null;
  contentStyle?: ContentStyle;
  onEndReachedThreshold?: number;
  showScrollIndicator?: boolean;
}

export function InfiniteList<T, K extends keyof T = keyof T>(
  props: InfiniteListProps<T, K>
) {
  const {
    style,
    contentContainerStyle,
    data,
    idKey,
    renderItem,
    loadMore,
    loading,
    hasMore,
    extraData,
    estimatedItemSize,
    ListEmptyComponent,
    ListFooterComponent,
    LoadingViewContent,
    onEndReachedThreshold = 0.05,
    renderResultsHeader,
    totalItems,
    itemGap = Spacings.xs,
    showScrollIndicator = false,
    ...rest
  } = props;

  const keyExtractor = useCallback((item: T) => String(item[idKey]), [idKey]);

  const renderItemWrapped = useCallback(
    ({ item }: { item: T }) => renderItem(item),
    [renderItem]
  );

  console.log('loading: ', loading);

  const onEndReached = useCallback(() => {
    if (!loading && hasMore && loadMore) {
      loadMore();
    }
  }, [loading, hasMore, loadMore]);

  const Separator = useCallback(
    () => <View style={{ height: itemGap }} />,
    [itemGap]
  );

  const footerComponent =
    ListFooterComponent ??
    (loading ? (
      <ListLoadingView content={LoadingViewContent} />
    ) : (
      // small footer helps ensure there’s space to hit the end
      <View style={{ height: 16 }} />
    ));

  const emptyComponent = loading
    ? null
    : ListEmptyComponent ?? <EmptyListView />;

  const mergedContentContainerStyle: ContentStyle = StyleSheet.flatten([
    styles.contentContainer,
    contentContainerStyle,
  ]);

  // Ensures separators re-render when data grows or
  // data changes based on extraData prop
  const stableExtraData = useMemo(
    () => [data.length, itemGap, extraData],
    [data.length, itemGap, extraData]
  );

  return (
    <View style={[styles.container, style]}>
      <ResultsHeader
        visibleCount={data.length}
        totalCount={totalItems}
        renderResultsHeader={renderResultsHeader}
        style={styles.resultsHeader}
      />

      <FlashList<T>
        estimatedItemSize={estimatedItemSize}
        data={data as T[]}
        keyExtractor={keyExtractor}
        renderItem={renderItemWrapped}
        onEndReached={onEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
        ItemSeparatorComponent={Separator}
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
  container: {
    flex: 1,
    borderWidth: 4,
    borderColor: 'red',
  },
  contentContainer: {
    paddingBottom: 60,
  },
  resultsHeader: {
    marginBottom: Spacings.xs,
  },
});
