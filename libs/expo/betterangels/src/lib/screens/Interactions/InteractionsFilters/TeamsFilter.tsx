import { ChevronLeftIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  BaseContainer,
  Button,
  MultiSelect,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { enumDisplaySelahTeam } from '../../../static';
import { Modal } from '../../../ui-components';

const valueAsSelahTeamEnum = Object.entries(enumDisplaySelahTeam).map(
  ([key, value]) => ({
    id: key,
    label: value,
  })
);

export default function InteractionsFilters() {
  const [selected, setSelected] = useState<
    Array<{ id: string; label: string }>
  >([{ id: 'all_teams', label: 'All Teams' }]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  return (
    <View style={{ marginBottom: Spacings.xl, alignItems: 'flex-start' }}>
      <Pressable
        onPress={() => setIsModalVisible(true)}
        accessibilityRole="button"
        style={{
          borderRadius: Radiuses.xxl,
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacings.xxs,
          paddingVertical: Spacings.xs,
          paddingLeft: Spacings.xs,
          backgroundColor: Colors.PRIMARY,
        }}
      >
        <TextRegular color="white">All Teams</TextRegular>
        <BaseContainer mx="xs" my="xxs">
          <ChevronLeftIcon color="white" size="sm" rotate="-90deg" />
        </BaseContainer>
      </Pressable>
      <Modal
        isModalVisible={isModalVisible}
        closeModal={() => setIsModalVisible(false)}
        closeButton
        vertical
      >
        <View
          style={{ paddingHorizontal: Spacings.md, flex: 1, gap: Spacings.lg }}
        >
          <ScrollView>
            <MultiSelect
              selectAllIdx={0}
              filterPlaceholder="Search"
              withFilter
              selectAllLabel="All Teams"
              title="Filter - Teams"
              onChange={(e) => setSelected(e)}
              options={[
                { id: 'all_teams', label: 'All Teams' },
                ...valueAsSelahTeamEnum,
              ]}
              selected={selected}
              valueKey="id"
              labelKey="label"
            />
          </ScrollView>
          <Button
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
