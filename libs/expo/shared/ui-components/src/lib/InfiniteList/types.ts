import { type FlashListProps } from '@shopify/flash-list';
import type { ComponentType, ReactElement, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { XOR } from 'ts-essentials';
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
type ExtractKeyProps<T> = XOR<
  { idKey: Extract<keyof T, string | number> },
  { keyExtractor: (item: T, index: number) => string }
>;

// for infinite scroll
type LoadMorePair = { loadMore: () => void; hasMore: boolean };
type LoadMoreNever = { loadMore?: never; hasMore?: never };

type LoadMoreProps = XOR<LoadMorePair, LoadMoreNever>;

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
