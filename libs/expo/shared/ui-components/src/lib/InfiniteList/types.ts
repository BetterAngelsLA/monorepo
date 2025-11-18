import { type FlashListProps } from '@shopify/flash-list';
import type { ComponentType, ReactElement, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
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
  itemGap?: number;
  totalItems?: number;
  modelName?: string; // singular model name to render in ResultsHeader
  modelNamePlural?: string; // plural model name to render in ResultsHeader
  renderResultsHeader?: TRenderListResultsHeader | null;
  LoadingViewContent?: ReactNode | null;
  showScrollIndicator?: boolean;
  ItemSeparatorComponent?: ComponentType<any> | null;
  error?: boolean; // determines whether to show ErrorView
  errorTitle?: string;
  errorMessage?: string;
  ErrorViewComponent?: ComponentType<any> | ReactElement | null;
};

export type TInfiniteListProps<T> = InfiniteListBaseProps<T> &
  ExtraFlashListProps<T> &
  // ExtractKeyProps<T> &
  LoadMoreProps;
