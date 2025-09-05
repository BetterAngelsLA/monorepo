import { ComponentProps, ReactElement, ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { InfiniteList } from '../InfiniteList';
import { TMultiSelectItem } from './MultiSelectItem';

// Common props
type MultiSelectSharedProps<T> = {
  style?: StyleProp<ViewStyle>;
  options?: T[];
  selected: T[];
  valueKey: keyof T;
  labelKey: keyof T;
  onChange: (newSelected: T[]) => void;
  title?: string;
  useVirtualized?: boolean; // use FlashList?
  // including estimatedItemSize helps with performance
  // list items should be roughly similar size - see FlashList suggestion in console
  estimatedItemSize?: number;

  // Visuals
  itemGap?: number;
  contentStyle?: ComponentProps<typeof InfiniteList<T>>['contentStyle'];
  onEndReachedThreshold?: number;
  showScrollIndicator?: boolean;

  // Customize
  renderOption?: (
    option: T,
    props: TMultiSelectItem,
    index?: number
  ) => ReactElement;
  ListEmptyComponent?: ReactElement | null;
  ListFooterComponent?: ReactElement | null;
  LoadingViewContent?: ReactNode | null;
};

// Local Mode — client-side filter, no remote search/pagination
type MultiSelectLocalProps<T> = MultiSelectSharedProps<T> & {
  mode?: 'local';
  withFilter?: boolean; // show local search box?
  searchPlaceholder?: string;
  searchDebounceMs?: number;

  // Never
  onSearch?: never;
  searchQuery?: never;
  loadMore?: never;
  hasMore?: never;
  totalOptions?: never;
  loading?: boolean;
};

// Remote Mode — server search + pagination
type MultiSelectRemoteProps<T> = MultiSelectSharedProps<T> & {
  mode: 'remote';
  onSearch: (query: string) => void;
  searchQuery?: string;
  searchPlaceholder?: string;
  searchDebounceMs?: number;

  // Pagination
  loadMore?: () => void;
  hasMore?: boolean;
  totalOptions?: number;
  loading?: boolean;

  // Never
  withFilter?: never;
};

export type MultiSelectProps<T> =
  | MultiSelectLocalProps<T>
  | MultiSelectRemoteProps<T>;
