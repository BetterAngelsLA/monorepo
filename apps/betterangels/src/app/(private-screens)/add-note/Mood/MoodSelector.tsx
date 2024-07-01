import {
  MoodEnum,
  useCreateNoteMoodMutation,
  useDeleteMoodMutation,
} from '@monorepo/expo/betterangels';
import { Colors } from '@monorepo/expo/shared/static';
import { Checkbox, TextRegular } from '@monorepo/expo/shared/ui-components';
import { debounce } from 'lodash';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MoodAttributes } from './types';

interface MoodCheckboxProps {
  moodEnum: MoodEnum;
  moodAttributes: MoodAttributes;
  isChecked: boolean;
  noteId: string | undefined;
  onChange: (isSelected: boolean) => void;
}

const MoodCheckbox: React.FC<MoodCheckboxProps> = ({
  moodEnum,
  moodAttributes,
  isChecked,
  noteId,
  onChange,
}) => {
  const [createNoteMood] = useCreateNoteMoodMutation();
  const [deleteMood] = useDeleteMoodMutation();
  const [moodId, setMoodId] = useState<string | undefined>();
  const [checked, setChecked] = useState<boolean>(isChecked);

  const processAction = async (checked: boolean) => {
    if (!noteId) return;
    if (checked) {
      const { data } = await createNoteMood({
        variables: {
          data: {
            noteId: noteId,
            descriptor: moodEnum,
          },
        },
      });
      if (data && 'id' in data.createNoteMood) {
        setMoodId(data.createNoteMood.id);
      }
    } else {
      if (!moodId) return;
      await deleteMood({
        variables: {
          data: { id: moodId },
        },
      });
      setMoodId(undefined);
    }
  };

  const debouncedProcessAction = debounce((checked: boolean) => {
    processAction(checked);
  }, 300);

  return (
    <Checkbox
      isChecked={checked}
      mt="xs"
      hasBorder
      onCheck={() => {
        onChange(!checked);
        setChecked(!checked);
        debouncedProcessAction(!checked);
      }}
      accessibilityHint={moodAttributes.title}
      label={
        <View style={styles.labelContainer}>
          <moodAttributes.Icon color={Colors.PRIMARY_EXTRA_DARK} size="md" />
          <TextRegular ml="xs">{moodAttributes.title}</TextRegular>
        </View>
      }
    />
  );
};

const MoodSelector: React.FC<{
  moodsData: Record<MoodEnum, MoodAttributes>;
  tab: 'pleasant' | 'neutral' | 'unpleasant';
  noteId: string | undefined;
}> = ({ moodsData, tab, noteId }) => {
  const [selectedMoods, setSelectedMoods] = useState<Set<MoodEnum>>(new Set());

  const filteredMoods = Object.entries(moodsData).filter(
    ([_, mood]) => mood.tab === tab
  );

  const handleMoodChange = (moodEnum: MoodEnum, isSelected: boolean) => {
    setSelectedMoods((prevSelectedMoods) => {
      if (isSelected) {
        prevSelectedMoods.add(moodEnum);
      } else {
        prevSelectedMoods.delete(moodEnum);
      }
      setSelectedMoods(prevSelectedMoods);
      return prevSelectedMoods;
    });
  };

  return (
    <View>
      {filteredMoods.map(([moodKey, moodAttributes]) => {
        const moodEnum = moodKey as MoodEnum;
        return (
          <MoodCheckbox
            key={moodEnum.toLowerCase()}
            moodEnum={moodEnum}
            moodAttributes={moodAttributes}
            isChecked={selectedMoods.has(moodEnum)}
            noteId={noteId}
            onChange={(isSelected) => handleMoodChange(moodEnum, isSelected)}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default MoodSelector;
