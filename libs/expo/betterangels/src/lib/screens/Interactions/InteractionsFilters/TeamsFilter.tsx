import { Spacings } from '@monorepo/expo/shared/static';
import {
  Button,
  MultiSelect,
  SelectButton,
} from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SelahTeamEnum } from '../../../apollo';
import { enumDisplaySelahTeam } from '../../../static';
import { Modal } from '../../../ui-components';

interface IInteractionsFiltersProps {
  setFilters: (filters: {
    teams: { id: SelahTeamEnum; label: string }[];
  }) => void;
  filters: { teams: { id: SelahTeamEnum; label: string }[] };
}

const valueAsSelahTeamEnum = Object.entries(enumDisplaySelahTeam).map(
  ([key, value]) => ({
    id: key as SelahTeamEnum,
    label: value,
  })
);

export default function InteractionsFilters(props: IInteractionsFiltersProps) {
  const { setFilters, filters } = props;
  const [selected, setSelected] = useState<
    Array<{ id: SelahTeamEnum; label: string }>
  >([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleOnDone = () => {
    setFilters({ ...filters, teams: selected });
    setIsModalVisible(false);
  };

  const handleCloseModal = () => {
    setSelected(filters.teams);
    setIsModalVisible(false);
  };

  const handleSelectButtonPress = () => {
    setSelected(filters.teams);
    setIsModalVisible(true);
  };

  return (
    <View style={{ marginBottom: Spacings.xl, alignItems: 'flex-start' }}>
      <SelectButton
        defaultLabel="All Teams"
        selected={filters.teams?.map((item) => item.label)}
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
              withSelectAll
              selectAllLabel="All Teams"
              title="Filter - Teams"
              onChange={(e: { id: SelahTeamEnum; label: string }[]) =>
                setSelected(e)
              }
              options={valueAsSelahTeamEnum}
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
            accessibilityHint="apply selected teams filter"
          />
        </View>
      </Modal>
    </View>
  );
}
