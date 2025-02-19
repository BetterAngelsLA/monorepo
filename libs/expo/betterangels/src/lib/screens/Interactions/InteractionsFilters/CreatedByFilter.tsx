import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Button,
  Loading,
  MultiSelect,
  SelectButton,
} from '@monorepo/expo/shared/ui-components';
import { useCallback, useEffect, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SelahTeamEnum, useInteractionAuthorsQuery } from '../../../apollo';
import { useUser } from '../../../hooks';
import { Modal } from '../../../ui-components';

type TFilters = {
  teams: { id: SelahTeamEnum; label: string }[];
  createdBy: { id: string; label: string }[];
};

interface ICreatedByFilterProps {
  setFilters: (filters: TFilters) => void;
  filters: TFilters;
}

const paginationLimit = 25;

export default function CreatedByFilter(props: ICreatedByFilterProps) {
  const { setFilters, filters } = props;
  const { user } = useUser();
  const [selected, setSelected] = useState<
    Array<{ id: string; label: string }>
  >([]);
  const [authors, setAuthors] = useState<{ id: string; label: string }[]>([]);
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { data, loading, error } = useInteractionAuthorsQuery({
    variables: {
      pagination: { limit: paginationLimit, offset: offset },
    },
  });

  const handleOnDone = () => {
    setFilters({ ...filters, createdBy: selected });
    setIsModalVisible(false);
  };

  const handleCloseModal = () => {
    setSelected(filters.createdBy);
    setIsModalVisible(false);
  };

  const handleSelectButtonPress = () => {
    setSelected(filters.createdBy);
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

  useEffect(() => {
    if (!data?.interactionAuthors) return;

    const { totalCount, results } = data.interactionAuthors;

    const filteredAuthors = results.map((item) => ({
      id: item.id,
      label: user?.id === item.id ? 'Me' : `${item.firstName} ${item.lastName}`,
    }));

    setAuthors((prevAuthors) => {
      const uniqueAuthors = [...prevAuthors, ...filteredAuthors].filter(
        (v, i, a) => a.findIndex((t) => t.id === v.id) === i
      );
      return uniqueAuthors;
    });

    setHasMore(offset + paginationLimit < totalCount);
  }, [data, offset]);

  if (error) throw new Error('Something went wrong!');

  return (
    <View>
      <SelectButton
        defaultLabel="All Authors"
        selected={filters.createdBy?.map((item) => item.label)}
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
          <Text>
            {data?.interactionAuthors.totalCount} {authors.length}
          </Text>
          <ScrollView
            onScroll={handleScroll}
            scrollEventThrottle={200}
            showsVerticalScrollIndicator={false}
          >
            <MultiSelect
              withSelectAll
              filterPlaceholder="Search"
              withFilter
              title="Filter - Authors"
              onChange={(e: { id: string; label: string }[]) => setSelected(e)}
              options={authors}
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
