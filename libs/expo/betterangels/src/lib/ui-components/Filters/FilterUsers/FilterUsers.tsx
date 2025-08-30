import { NetworkStatus } from '@apollo/client';
import {
  PaginatedList,
  TFilterOption,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { FlashList } from '@shopify/flash-list';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { Ordering } from '../../../apollo';
import { useGetUsersQuery } from './__generated__/getUsers.generated';

const paginationLimit = 20;

type TProps = {
  onChange: (filters: TFilterOption[]) => void;
  selected: TFilterOption[];
  title?: string;
  currentUserId?: string;
  style?: StyleProp<ViewStyle>;
};

export function FilterUsers(props: TProps) {
  const { currentUserId, style } = props;

  const [options, setOptions] = useState<TFilterOption[]>([]);
  const [filterSearch, setFilterSearch] = useState('');

  const orderVars = useMemo(
    () => ({
      // firstName: Ordering.AscNullsFirst,
      // lastName: Ordering.AscNullsFirst,
      // id: Ordering.Desc,
      id: Ordering.Asc,
    }),
    []
  );

  const { data, error, fetchMore, networkStatus } = useGetUsersQuery({
    variables: {
      filters: { search: filterSearch },
      order: orderVars,
      pagination: { limit: paginationLimit, offset: 0 },
    },
    // allow distinguishing `initial` load vs `loading more`
    notifyOnNetworkStatusChange: true,
  });

  useEffect(() => {
    const results = data?.interactionAuthors?.results ?? [];

    // console.log('*****************  results Len:', results.length);

    const newOptions = results
      .filter((item) => (currentUserId ? item.id !== currentUserId : true))
      .map((item) => ({
        id: item.id,
        label: `${item.id} - ${item.firstName ?? ''} ${
          item.lastName ?? ''
        }`.trim(),
      }));

    setOptions(newOptions);
  }, [data, currentUserId]);

  const results = data?.interactionAuthors?.results ?? [];
  const total = data?.interactionAuthors?.totalCount ?? 0;
  const hasMore = results.length < total;

  const loadingMore = networkStatus === NetworkStatus.fetchMore;

  // Prevent rapid double-calls from FlashList
  const fetchingRef = useRef(false);

  useEffect(() => {
    if (!loadingMore) {
      fetchingRef.current = false;
    }
  }, [loadingMore]);

  const loadMore = () => {
    if (!hasMore || loadingMore || fetchingRef.current) {
      return;
    }

    fetchingRef.current = true;

    fetchMore({
      variables: {
        filters: { search: filterSearch },
        order: orderVars,
        pagination: { limit: paginationLimit, offset: results.length },
      },
    }).catch(() => {
      fetchingRef.current = false;
    });
  };

  const renderItemFn = useCallback(({ item }: { item: TFilterOption }) => {
    return <TextRegular>{item.label}</TextRegular>;
  }, []);

  if (error) {
    return (
      <TextRegular>
        Failed to load users: {String(error.message ?? error)}
      </TextRegular>
    );
  }

  return (
    <>
      <PaginatedList queryName="interactionAuthors" />

      <FlashList<TFilterOption>
        style={style}
        estimatedItemSize={95}
        data={options}
        keyExtractor={(item) => item.id}
        renderItem={renderItemFn}
        onEndReached={loadMore}
        onEndReachedThreshold={0.05} // keep your original that worked
        ItemSeparatorComponent={() => <View style={{ height: 35 }} />}
        // small footer helps ensure there’s space to hit the end
        ListFooterComponent={
          loadingMore ? (
            <TextRegular>Loading…</TextRegular>
          ) : (
            <View style={{ height: 16 }} />
          )
        }
        contentContainerStyle={{ paddingBottom: 60 }}
      />
    </>
  );
}

// import {
//   TFilterOption,
//   TextRegular,
// } from '@monorepo/expo/shared/ui-components';
// import { FlashList } from '@shopify/flash-list';
// import { useCallback, useEffect, useState } from 'react';
// import { StyleProp, View, ViewStyle } from 'react-native';
// import { Ordering } from '../../../apollo';
// import { useGetUsersQuery } from './__generated__/getUsers.generated';

// const paginationLimit = 10;

// type TProps = {
//   onChange: (filters: TFilterOption[]) => void;
//   selected: TFilterOption[];
//   title?: string;
//   currentUserId?: string;
//   style?: StyleProp<ViewStyle>;
// };

// export function FilterUsers(props: TProps) {
//   const [options, setOptions] = useState<TFilterOption[]>([]);
//   const [filterSearch, setFilterSearch] = useState('');

//   const { data, loading, error, fetchMore } = useGetUsersQuery({
//     variables: {
//       filters: { search: filterSearch },
//       order: {
//         firstName: Ordering.AscNullsFirst,
//         lastName: Ordering.AscNullsFirst,
//         id: Ordering.Desc,
//       },
//       pagination: { limit: paginationLimit, offset: 0 },
//     },
//   });

//   useEffect(() => {
//     if (!data?.interactionAuthors) {
//       return;
//     }

//     const { results } = data.interactionAuthors;

//     const newOptions = results
//       .filter((item) => item.id !== '1')
//       .map((item) => ({
//         id: item.id,
//         label: `${item.id} - ${item.firstName} ${item.lastName || ''}`,
//       }));

//     setOptions(newOptions);
//   }, [data]);

//   const results = data?.interactionAuthors?.results ?? [];
//   const total = data?.interactionAuthors?.totalCount ?? 0;
//   const hasMore = results.length < total;

//   const loadMore = () => {
//     if (!hasMore || loading) {
//       return;
//     }

//     fetchMore({
//       variables: {
//         filters: { search: filterSearch },
//         order: {
//           firstName: Ordering.AscNullsFirst,
//           lastName: Ordering.AscNullsFirst,
//           id: Ordering.Desc,
//         },
//         pagination: { limit: paginationLimit, offset: results.length },
//       },
//     });
//   };

//   const renderItemFn = useCallback(({ item }: { item: TFilterOption }) => {
//     return <TextRegular>{item.label}</TextRegular>;
//   }, []);

//   return (
//     <FlashList<TFilterOption>
//       estimatedItemSize={95}
//       data={options}
//       keyExtractor={(item) => item.id}
//       renderItem={renderItemFn}
//       onEndReached={loadMore}
//       onEndReachedThreshold={0.05}
//       ItemSeparatorComponent={() => <View style={{ height: 35 }} />}
//       contentContainerStyle={{
//         paddingBottom: 60,
//       }}
//     />
//   );
// }

// <Filters.Options
//   title={title}
//   options={options}
//   onSelected={onSelect}
//   onSearch={(r) => console.log(r)}
//   searchDebounceMs={300}
//   initalSelected={selected}
//   searchPlaceholder="Search authors"
//   style={{ paddingHorizontal: pagePaddingHorizontal }}
// />

// <Filters.Button
//   id="Authors"
//   selected={selected.map((s) => s.label)}
//   onPress={onFilterPress}
//   style={style}
//   labelMaxWidth={100}
// />

// function onSelect(newSelected: TFilterOption[]) {
//   onChange(newSelected);

//   closeModalScreen();
// }

// function onFilterPress(id: string) {
//   showModalScreen({
//     presentation: 'modal',
//     content: (
//       <Filters.Options
//         title={title}
//         options={teamOptions}
//         onSelected={onSelect}
//         onSearch={(r) => console.log(r)}
//         searchDebounceMs={300}
//         initalSelected={selected}
//         searchPlaceholder="Search authors"
//         style={{ paddingHorizontal: pagePaddingHorizontal }}
//       />
//     ),
//     title: title,
//   });
// }

// const { showModalScreen, closeModalScreen } = useModalScreen();

// const {
//   onChange,
//   selected,
//   currentUserId,
//   style,
//   title = 'Filter Users',
// } = props;
