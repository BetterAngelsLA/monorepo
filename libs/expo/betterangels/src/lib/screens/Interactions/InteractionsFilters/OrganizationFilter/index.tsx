import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Button,
  Loading,
  MultiSelect,
  SelectButton,
} from '@monorepo/expo/shared/ui-components';
import { debounce } from '@monorepo/expo/shared/utils';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Ordering, SelahTeamEnum } from '../../../../apollo';
import { useInfiniteScroll, useUser } from '../../../../hooks';
import { Modal } from '../../../../ui-components';
import { useCaseworkerOrganizationsQuery } from './__generated__/OrganizationFilter.generated';

type TFilters = {
  authors: { id: string; label: string }[];
  organizations: { id: string; label: string }[];
  teams: { id: SelahTeamEnum; label: string }[];
};

interface IOrganizationFilterProps {
  setFilters: (filters: TFilters) => void;
  filters: TFilters;
}

const paginationLimit = 25;

export default function OrganizationFilter(props: IOrganizationFilterProps) {
  const { setFilters, filters } = props;
  const { user } = useUser();
  const [search, setSearch] = useState<string>('');
  const [filterSearch, setFilterSearch] = useState('');
  const [selected, setSelected] = useState<
    Array<{ id: string; label: string }>
  >([]);
  const [organizationsState, setOrganizationsState] = useState<
    { id: string; label: string }[]
  >([]);
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { data, loading, error } = useCaseworkerOrganizationsQuery({
    variables: {
      filters: { search: filterSearch },
      order: {
        name: Ordering.AscNullsLast,
        id: Ordering.Desc,
      },
      pagination: { limit: paginationLimit, offset: offset },
    },
  });

  const loadMoreInteractions = useCallback(() => {
    if (!hasMore || loading) return;

    setOffset((prevOffset) => prevOffset + paginationLimit);
  }, [hasMore, loading]);

  const { handleScroll } = useInfiniteScroll({
    loading,
    hasMore,
    onLoadMore: loadMoreInteractions,
  });

  const handleOnDone = () => {
    setFilters({ ...filters, organizations: selected });
    setIsModalVisible(false);
  };

  const handleClearBoxes = () => {
    setSelected([]);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setSelected(filters.organizations);
    setIsModalVisible(false);
  };

  const handleSelectButtonPress = () => {
    setSelected(filters.organizations);
    setIsModalVisible(true);
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
    if (!data?.caseworkerOrganizations) return;

    const { totalCount, results } = data.caseworkerOrganizations;

    const filteredOrganizations = results.map((item) => ({
      id: item.id,
      label: `${item.name}`,
    }));

    if (offset === 0) {
      setOrganizationsState(filteredOrganizations);
    } else {
      setOrganizationsState((prevOrganizations) => [
        ...prevOrganizations,
        ...filteredOrganizations,
      ]);
    }

    setHasMore(offset + paginationLimit < totalCount);
  }, [data, offset]);

  if (error || !user) throw new Error('Something went wrong!');

  return (
    <View>
      <SelectButton
        defaultLabel="All Organizations"
        selected={filters.organizations?.map((item) => item.label)}
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
              title="Filter - Organizations"
              search={search}
              onSearch={onSearch}
              onChange={(e: { id: string; label: string }[]) => setSelected(e)}
              options={[...organizationsState]}
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

          <View
            style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}
          >
            <Button
              onPress={handleClearBoxes}
              size="md"
              title="Clear"
              variant="secondary"
              accessibilityHint="clear all selected"
            />

            <Button
              onPress={handleOnDone}
              size="md"
              title="Done"
              variant="primary"
              accessibilityHint="apply selected created by filter"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
