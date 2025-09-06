import type { ComponentProps, ReactElement } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { InfiniteList } from '../InfiniteList';
import type { TMultiSelectItem } from './MultiSelectItem';

export type SearchProps =
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
  options?: T[];
  selected: T[];
  valueKey: keyof T;
  labelKey: keyof T;
  onChange: (next: T[]) => void;

  title?: string;
  itemGap?: number;
  style?: StyleProp<ViewStyle>;

  withSelectAll?: boolean;
  selectAllIdx?: number | 'last';
  selectAllLabel?: string;
  selectAllValue?: string;

  renderOption?: (
    option: T,
    props: TMultiSelectItem,
    index: number
  ) => ReactElement;
  ListEmptyComponent?: ReactElement | null;
} & SearchProps;

export type InfiniteListProps<T> = Omit<
  ComponentProps<typeof InfiniteList<T>>,
  'data' | 'idKey' | 'renderItem'
>;

export type MultiSelectStaticProps<T> = MultiSelectBaseProps<T> & {
  infinite: false;
};

export type MultiSelectInfiniteProps<T> = MultiSelectBaseProps<T> & {
  infinite?: true;
  infiniteProps?: InfiniteListProps<T>;
};

export type MultiSelectProps<T> =
  | MultiSelectStaticProps<T>
  | MultiSelectInfiniteProps<T>;
