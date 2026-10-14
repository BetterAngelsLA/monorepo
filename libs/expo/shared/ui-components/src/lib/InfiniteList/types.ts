import { type FlashListProps } from '@shopify/flash-list';
import type { ComponentType, ReactElement } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { TLoadingListView } from './LoadingListView';
import { TRenderListResultsHeader } from './ResultsHeader';

// FlashListProps to pass thru
type ExtraFlashListProps<T> = Omit<
  Partial<FlashListProps<T>>,
  'data' | 'renderItem' | 'ItemSeparatorComponent' | 'onEndReached'
>;

type LoadMoreProps = {
  loadMore?: () => void;
  hasMore?: boolean;
};

// base props
type InfiniteListBaseProps<T> = {
  style?: StyleProp<ViewStyle>;
  data: T[];
  renderItem: (item: T) => ReactElement | null;
  estimatedItemSize?: number; // rendering optimization. see console message if undefined
  loading?: boolean;
  loadingMore?: boolean;
  itemGap?: number;
  totalItems?: number;
  modelName?: string; // singular model name to render in ResultsHeader
  modelNamePlural?: string; // plural model name to render in ResultsHeader
  renderResultsHeader?: TRenderListResultsHeader | null;
  loadingViewOptions?: TLoadingListView;
  showScrollIndicator?: boolean;
  ItemSeparatorComponent?: ComponentType<unknown> | null;
  error?: boolean; // determines whether to show ErrorView
  errorTitle?: string;
  errorMessage?: string;
  ErrorViewComponent?: ComponentType<unknown> | ReactElement | null;
  /**
   * When this value changes the list scrolls back to the top.
   * Pass the stable identity of the data source — typically the `queryKey`
   * returned by `useInfiniteScrollQuery` — so a shorter result set can never
   * leave the viewport scrolled past its content (blank list).
   */
  scrollResetKey?: string;
  /**
   * Whether the list's screen is on screen. Paging is withheld while this is
   * `false`, because a list kept mounted behind a pushed route re-checks "am I
   * at the end?" on every commit and would page in its whole dataset.
   *
   * A prop rather than something the list reads for itself, so this library does
   * not depend on the consuming app's router. Defaults to `true`.
   */
  isFocused?: boolean;
};

export type TInfiniteListProps<T> = InfiniteListBaseProps<T> &
  ExtraFlashListProps<T> &
  LoadMoreProps;
