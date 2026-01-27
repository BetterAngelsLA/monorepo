import { ReactNode, useCallback, useMemo } from 'react';
import { mergeCss } from '../../utils';
import { InfiniteScrollTrigger } from '../InfiniteScrollTrigger';
import { LoadingView } from '../LoadingView';
import { EmptyListView } from './views/EmptyListView';
import { ErrorListView } from './views/ErrorListView';
import {
  ListResultsHeader,
  TRenderListResultsHeader,
} from './views/ListResultsHeader';

export type InfiniteListProps<T> = {
  className?: string;
  contentClassName?: string;

  data: T[];
  totalItems?: number;
  renderItem: (item: T) => ReactNode;
  keyExtractor: (item: T, index: number) => string;

  loadMore?: () => void;
  hasMore?: boolean;

  loading?: boolean;
  loadingMore?: boolean;
  reloading?: boolean;

  error?: unknown;
  errorTitle?: string;
  errorMessage?: string;
  ErrorViewComponent?: ReactNode;

  itemGap?: number;

  ListEmptyComponent?: ReactNode;

  renderResultsHeader?: TRenderListResultsHeader | null;
  headerClassName?: string;

  renderDivider?: (index: number) => ReactNode;

  modelName?: string;
  modelNamePlural?: string;
};

export function InfiniteList<T>(props: InfiniteListProps<T>) {
  const {
    className,
    contentClassName,
    data,
    renderItem,
    keyExtractor,
    loadMore,
    hasMore = false,
    loading = false,
    loadingMore = false,
    reloading = false,
    error,
    errorTitle,
    errorMessage,
    totalItems,
    itemGap = 8,
    ListEmptyComponent,
    ErrorViewComponent,
    renderResultsHeader,
    headerClassName,
    renderDivider,
    modelName,
    modelNamePlural,
  } = props;

  const isAnyLoading = loading || loadingMore || reloading;

  const ErrorView = useMemo(() => {
    if (ErrorViewComponent === null) {
      return null;
    }

    return (
      ErrorViewComponent ?? (
        <ErrorListView
          title={errorTitle}
          bodyText={errorMessage}
          variant={!!data.length ? 'compact' : 'full'}
        />
      )
    );
  }, [ErrorViewComponent, errorTitle, errorMessage, data.length]);

  const EmptyView = useMemo(() => {
    if (ListEmptyComponent === null) {
      return null;
    }

    return ListEmptyComponent ?? <EmptyListView />;
  }, [isAnyLoading, error, ListEmptyComponent, ErrorView]);

  const onLoadMore = useCallback(() => {
    if (!isAnyLoading && hasMore && loadMore) {
      loadMore();
    }
  }, [isAnyLoading, hasMore, loadMore]);

  const isInitialLoading = isAnyLoading && data.length === 0;
  const isEmpty = !isAnyLoading && !error && data.length === 0;
  const isError = !isAnyLoading && !!error;

  const contentCss = ['flex', 'flex-col', contentClassName];

  return (
    <div className={className}>
      {!loading && !error && (
        <ListResultsHeader
          className={headerClassName}
          visibleCount={data.length}
          totalCount={totalItems}
          modelName={modelName}
          modelNamePlural={modelNamePlural}
          renderResultsHeader={renderResultsHeader}
        />
      )}

      {isInitialLoading && <LoadingView className="mt-4" />}

      <div
        className={mergeCss(contentCss)}
        style={{
          gap: itemGap,
        }}
      >
        {data.map((item, index) => {
          const isLast = index === data.length - 1;

          return (
            <div key={keyExtractor(item, index)}>
              {renderItem(item)}

              {!isLast && renderDivider?.(index)}
            </div>
          );
        })}

        {isEmpty && EmptyView}

        {isError && ErrorView}

        {hasMore && !error && (
          <InfiniteScrollTrigger onLoadMore={onLoadMore} enabled={hasMore} />
        )}
      </div>
    </div>
  );
}
