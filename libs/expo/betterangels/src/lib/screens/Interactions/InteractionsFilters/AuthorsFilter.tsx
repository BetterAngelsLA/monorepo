import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Button,
  Loading,
  MultiSelect,
  SelectButton,
} from '@monorepo/expo/shared/ui-components';
import { debounce } from '@monorepo/expo/shared/utils';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  View,
} from 'react-native';
import { SelahTeamEnum, useInteractionAuthorsQuery } from '../../../apollo';
import { useUser } from '../../../hooks';
import { Modal } from '../../../ui-components';

type TFilters = {
  teams: { id: SelahTeamEnum; label: string }[];
  authors: { id: string; label: string }[];
};

interface IAuthorsFilterProps {
  setFilters: (filters: TFilters) => void;
  filters: TFilters;
}

const paginationLimit = 25;

export default function AuthorsFilter(props: IAuthorsFilterProps) {
  const { setFilters, filters } = props;
  const { user } = useUser();
  const [search, setSearch] = useState<string>('');
  const [filterSearch, setFilterSearch] = useState('');
  const [selected, setSelected] = useState<
    Array<{ id: string; label: string }>
  >([]);
  const [authorsState, setAuthorsState] = useState<
    { id: string; label: string }[]
  >([]);
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { data, loading, error } = useInteractionAuthorsQuery({
    variables: {
      pagination: { limit: paginationLimit, offset: offset },
      filters: {
        search: filterSearch,
      },
    },
  });

  const handleOnDone = () => {
    setFilters({ ...filters, authors: selected });
    setIsModalVisible(false);
  };

  const handleCloseModal = () => {
    setSelected(filters.authors);
    setIsModalVisible(false);
  };

  const handleSelectButtonPress = () => {
    setSelected(filters.authors);
    setIsModalVisible(true);
  };

  const loadMoreInteractions = useCallback(() => {
    if (!hasMore || loading) return;

    setOffset((prevOffset) => prevOffset + paginationLimit);
  }, [hasMore, loading]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;

    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;

    if (isCloseToBottom) {
      loadMoreInteractions();
    }
  };

  const debounceFetch = useMemo(
    () =>
      debounce((text) => {
        setFilterSearch(text);
        setOffset(0);
      }, 500),
    []
  );

  const onSearch = (e: string) => {
    setSearch(e);
    debounceFetch(e);
  };

  useEffect(() => {
    if (!data?.interactionAuthors) return;

    const { totalCount, results } = data.interactionAuthors;

    const filteredAuthors = results
      .filter((item) => item.id !== user?.id && item.firstName)
      .map((item) => ({
        id: item.id,
        label: `${item.firstName} ${item.lastName}`,
      }));

    if (offset === 0) {
      setAuthorsState(filteredAuthors);
    } else {
      setAuthorsState((prevAuthors) => [...prevAuthors, ...filteredAuthors]);
    }

    setHasMore(offset + paginationLimit < totalCount);
  }, [data, offset]);

  if (error || !user) throw new Error('Something went wrong!');

  return (
    <View>
      <SelectButton
        defaultLabel="All Authors"
        selected={filters.authors?.map((item) => item.label)}
        onPress={handleSelectButtonPress}
      />

      <Modal
        isModalVisible={isModalVisible}
        closeModal={handleCloseModal}
        closeButton
        vertical
      >
        <View
          style={{ paddingHorizontal: Spacings.md, flex: 1, gap: Spacings.lg }}
        >
          <ScrollView
            onScroll={handleScroll}
            scrollEventThrottle={200}
            showsVerticalScrollIndicator={false}
          >
            <MultiSelect
              filterPlaceholder="Search"
              withFilter
              title="Filter - Authors"
              search={search}
              onSearch={onSearch}
              onChange={(e: { id: string; label: string }[]) => setSelected(e)}
              options={[{ id: user.id, label: 'Me' }, ...authorsState]}
              selected={selected}
              valueKey="id"
              labelKey="label"
            />
            {loading && hasMore && (
              <View style={{ marginTop: 10, alignItems: 'center' }}>
                <Loading size="large" color={Colors.NEUTRAL_DARK} />
              </View>
            )}
          </ScrollView>

          <Button
            onPress={handleOnDone}
            size="full"
            title="Done"
            variant="primary"
            accessibilityHint="apply selected created by filter"
          />
        </View>
      </Modal>
    </View>
  );
}
