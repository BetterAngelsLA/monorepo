import type { ReactElement } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { TInfiniteListProps } from '../InfiniteList';
import { TMultiSelectItem } from './components/MultiSelectItem';

type SearchProps =
  // Local, client-side filtering
  | {
      withLocalFilter: true;
      searchPlaceholder?: string;
      onSearch?: never;
      searchDebounceMs?: never;
    }
  // Server-side search (UI emits query; parent fetches and updates `options`)
  | {
      withLocalFilter?: false;
      onSearch: (q: string) => void;
      searchDebounceMs?: number;
      searchPlaceholder?: string;
    }
  // No search
  | {
      withLocalFilter?: false;
      onSearch?: undefined;
      searchDebounceMs?: never;
      searchPlaceholder?: string;
    };

export type MultiSelectBaseProps<T> = {
  options: T[];
  selected: T[];
  valueKey: Extract<keyof T, string | number>;
  labelKey: Extract<keyof T, string | number>;
  onChange: (next: T[]) => void;

  // optional
  title?: string;
  itemGap?: number;
  style?: StyleProp<ViewStyle>;

  renderOption?: (
    option: T,
    props: TMultiSelectItem,
    index: number
  ) => ReactElement;

  ListEmptyComponent?: ReactElement | null;

  // selectAll opts
  withSelectAll?: boolean;
  selectAllIdx?: number | 'last';
  selectAllLabel?: string;
  selectAllValue?: string;
} & SearchProps;

type InfiniteProps<T> = Omit<
  TInfiniteListProps<T>,
  | 'data'
  | 'renderItem'
  | 'idKey'
  | 'keyExtractor'
  | 'loadMore'
  | 'hasMore'
  | 'extraData'
>;

export type MultiSelectStaticProps<T> = MultiSelectBaseProps<T> & {
  infinite?: false;
};

export type MultiSelectInfiniteProps<T> = MultiSelectBaseProps<T> & {
  infinite: true;
  infiniteProps?: InfiniteProps<T>;
};

export type MultiSelectProps<T> =
  | MultiSelectStaticProps<T>
  | MultiSelectInfiniteProps<T>;
