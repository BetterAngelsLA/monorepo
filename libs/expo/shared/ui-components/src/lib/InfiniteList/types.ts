import { type FlashListProps } from '@shopify/flash-list';
import type { ComponentType, ReactElement, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { TRenderResultsHeader } from './ResultsHeader';

// FlashListProps to pass thru
type ExtraFlashListProps<T> = Omit<
  Partial<FlashListProps<T>>,
  | 'data'
  | 'renderItem'
  | 'keyExtractor'
  | 'ItemSeparatorComponent'
  | 'onEndReached'
>;

// FlashList keyExtractor strategy
// pass either idKey or custom keyExtractor fn
type ExtractKeyProps<T> =
  | { idKey: keyof T; keyExtractor?: undefined }
  | { idKey?: undefined; keyExtractor: (item: T, index: number) => string };

// for infinite scroll
type LoadMoreProps =
  | { loadMore: () => void; hasMore: boolean }
  | { loadMore?: undefined; hasMore?: undefined };

// base props
type InfiniteListBaseProps<T> = {
  style?: StyleProp<ViewStyle>;
  data: T[];
  renderItem: (item: T) => ReactElement | null;
  estimatedItemSize?: number; // rendering optimization. see console message if undefined
  loading?: boolean;
  itemGap?: number;
  totalItems?: number;
  renderResultsHeader?: TRenderResultsHeader | null;
  LoadingViewContent?: ReactNode | null;
  showScrollIndicator?: boolean;
  ItemSeparatorComponent?: ComponentType<any> | null;
};

export type TInfiniteListProps<T> = InfiniteListBaseProps<T> &
  ExtraFlashListProps<T> &
  ExtractKeyProps<T> &
  LoadMoreProps;
