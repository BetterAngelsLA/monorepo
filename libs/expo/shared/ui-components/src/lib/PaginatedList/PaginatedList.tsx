import { useApolloClient } from '@apollo/client';
import { assertQueryFieldHasMerge } from '@monorepo/expo/shared/clients';

type TProps = {
  queryName: string;
};

export function PaginatedList(props: TProps) {
  const { queryName } = props;
  const client = useApolloClient();

  assertQueryFieldHasMerge(client.cache, queryName);

  return null;
}

// import {
//   NetworkStatus,
//   useApolloClient,
//   type ApolloQueryResult,
// } from '@apollo/client';
// import { FlashList, type ListRenderItem } from '@shopify/flash-list';
// import React, { useEffect, useMemo } from 'react';
// import { View } from 'react-native';
// import { useApolloLoadMore } from './useApolloLoadMore';

// type QueryHookResult<TData, TVars> = {
//   data: TData | undefined;
//   error?: unknown;
//   fetchMore: (opts: { variables: TVars }) => Promise<ApolloQueryResult<TData>>;
//   networkStatus: NetworkStatus;
// };

// type UseQueryHook<TData, TVars> = (args: {
//   variables: TVars;
//   notifyOnNetworkStatusChange?: boolean;
// }) => QueryHookResult<TData, TVars>;

// type Selector<TData, TItem> = (data: TData | undefined) => {
//   items: ReadonlyArray<TItem>;
//   total: number;
// };

// type BuildVars<TVars> = (offset: number) => TVars;

// type PaginatedListProps<TItem, TData, TVars> = {
//   /** Your generated hook, e.g. useGetUsersQuery */
//   useQueryHook: UseQueryHook<TData, TVars>;
//   /** Initial variables (offset will be overridden to 0) */
//   initialVars: TVars;
//   /** Select items + total out of TData (works with wrappers or arrays) */
//   select: Selector<TData, TItem>;
//   /** Called to build variables given the next offset */
//   buildVars: BuildVars<TVars>;
//   /** The Query field name, used to validate the cache policy (e.g., 'interactionAuthors') */
//   queryFieldName: string;

//   /** FlashList props */
//   renderItem: ListRenderItem<TItem>;
//   keyExtractor: (item: TItem) => string;
//   estimatedItemSize: number;

//   /** Optional: header, footer, styling */
//   ListHeaderComponent?: React.ReactElement | null;
//   ListEmptyComponent?: React.ReactElement | null;
//   contentBottomPadding?: number;

//   /** Optional: warn/assert if policy missing */
//   onPolicyMissing?: (field: string) => void;
// };

// export function PaginatedList<TItem, TData, TVars>(
//   props: PaginatedListProps<TItem, TData, TVars>
// ) {
//   const {
//     useQueryHook,
//     initialVars,
//     select,
//     buildVars,
//     queryFieldName,
//     renderItem,
//     keyExtractor,
//     estimatedItemSize,
//     ListHeaderComponent,
//     ListEmptyComponent,
//     contentBottomPadding = 60,
//     onPolicyMissing,
//   } = props;

//   const client = useApolloClient();

//   // Validate cache policy once (dev-friendly)
//   useEffect(() => {
//     const { present, hasMerge } = checkQueryFieldPolicy(
//       client.cache as any,
//       queryFieldName
//     );
//     if (!present || !hasMerge) {
//       onPolicyMissing?.(queryFieldName);
//       if (__DEV__) {
//         // eslint-disable-next-line no-console
//         console.warn(
//           `[PaginatedList] Missing or invalid cache policy for Query.${queryFieldName}. ` +
//             `Define keyArgs + merge for correct pagination.`
//         );
//       }
//     }
//   }, [client.cache, queryFieldName, onPolicyMissing]);

//   // Always start at offset 0; let cache policy merge pages
//   const hookResult = useQueryHook({
//     variables: initialVars,
//     notifyOnNetworkStatusChange: true,
//   });

//   const { data, error, fetchMore, networkStatus } = hookResult;
//   const { items, total } = useMemo(() => select(data), [data, select]);

//   const { hasMore, loadingMore, loadMore } = useApolloLoadMore({
//     fetchMore,
//     networkStatus,
//     itemsLength: items.length,
//     totalCount: total,
//     buildVars,
//   });

//   if (error) {
//     return (
//       <FlashList
//         data={[]}
//         estimatedItemSize={estimatedItemSize}
//         ListHeaderComponent={ListHeaderComponent ?? null}
//         ListEmptyComponent={
//           ListEmptyComponent ?? (
//             <View style={{ padding: 16 }}>{/* Replace with your UI */}</View>
//           )
//         }
//         renderItem={() => null}
//       />
//     );
//   }

//   return (
//     <FlashList<TItem>
//       data={items as TItem[]}
//       estimatedItemSize={estimatedItemSize}
//       keyExtractor={keyExtractor}
//       renderItem={renderItem}
//       onEndReached={hasMore ? loadMore : undefined}
//       onEndReachedThreshold={0.05}
//       ListHeaderComponent={ListHeaderComponent ?? null}
//       ListFooterComponent={
//         loadingMore ? (
//           <View style={{ padding: 12 }} />
//         ) : (
//           <View style={{ height: 16 }} />
//         )
//       }
//       ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
//       contentContainerStyle={{ paddingBottom: contentBottomPadding }}
//     />
//   );
// }
