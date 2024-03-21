import { useMutation } from '@apollo/client';
import { UPDATE_NOTE } from '@monorepo/expo/betterangels';
import { IIconProps } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
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
  noteId: string | undefined;
}

const MoodSelector: React.FC<MoodSelectorProps> = ({ moodsData, noteId }) => {
  const { setValue, watch } = useFormContext();
  const selectedMoods = watch('moods') || [];
  const [updateNote] = useMutation(UPDATE_NOTE);

  const toggleMood = async (mood: string) => {
    try {
      const newMoods = selectedMoods.includes(mood)
        ? selectedMoods.filter((m: string) => m !== mood)
        : [...selectedMoods, mood];

      const moodsForDB = selectedMoods.includes(mood)
        ? selectedMoods
            .filter((m: string) => m !== mood)
            .map((m: string) => ({
              descriptor: m.replace(/ |\/+/g, '_').toUpperCase(),
            }))
        : [...selectedMoods, mood].map((m: string) => ({
            descriptor: m.replace(/ |\/+/g, '_').toUpperCase(),
          }));

      await updateNote({
        variables: {
          data: {
            id: noteId,
            moods: moodsForDB,
          },
        },
      });
      setValue('moods', newMoods);
    } catch (e) {
      console.log('Error updating note mood', e);
    }
  };

  return (
    <View>
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
              <mood.Icon color={Colors.PRIMARY_EXTRA_DARK} size="md" />
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
