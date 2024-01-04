import { IIconProps } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { BodyText, Checkbox } from '@monorepo/expo/shared/ui-components';
import React, { ComponentType } from 'react';
import { useFormContext } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

interface Mood {
  Icon: ComponentType<IIconProps>;
  title: string;
}

interface MoodSelectorProps {
  moodsData: Mood[];
}

const MoodSelector: React.FC<MoodSelectorProps> = ({ moodsData }) => {
  const { setValue, watch } = useFormContext();
  const selectedMoods = watch('moods') || [];

  const toggleMood = (mood: string) => {
    const newMoods = selectedMoods.includes(mood)
      ? selectedMoods.filter((m: string) => m !== mood)
      : [...selectedMoods, mood];
    setValue('moods', newMoods);
  };

  return (
    <View style={{ paddingBottom: Spacings.md }}>
      {moodsData.map((mood, idx) => (
        <Checkbox
          isChecked={selectedMoods.includes(mood.title)}
          mt={idx !== 0 ? 'xs' : undefined}
          key={mood.title}
          hasBorder
          onCheck={() => toggleMood(mood.title)}
          accessibilityHint={mood.title}
          label={
            <View style={styles.labelContainer}>
              <mood.Icon color={Colors.PRIMARY_EXTRA_DARK} size="sm" />
              <BodyText ml="xs">{mood.title}</BodyText>
            </View>
          }
        />
      ))}
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
