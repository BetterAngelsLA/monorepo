import { Spacings } from '@monorepo/expo/shared/static';
import {
  Button,
  MultiSelect,
  SelectButton,
} from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SelahTeamEnum } from '../../../apollo';
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

export default function CreatedByFilter(props: ICreatedByFilterProps) {
  const { setFilters, filters } = props;
  const { user } = useUser();
  const [selected, setSelected] = useState<
    Array<{ id: string; label: string }>
  >([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

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
          <ScrollView>
            <MultiSelect
              filterPlaceholder="Search"
              withFilter
              title="Filter - Authors"
              onChange={(e: { id: string; label: string }[]) => setSelected(e)}
              options={[{ id: user?.id || '', label: 'Me' }]}
              selected={selected}
              valueKey="id"
              labelKey="label"
            />
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
