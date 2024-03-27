import { useMutation } from '@apollo/client';
import { CREATE_NOTE_MOOD } from '@monorepo/expo/betterangels';
import { IIconProps } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { BodyText, Checkbox } from '@monorepo/expo/shared/ui-components';
import {
  CreateNoteMoodInput,
  CreateNoteMoodMutationVariables,
} from 'libs/expo/betterangels/src/lib/apollo/gql-types/graphql';
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
  const [createNoteMood] = useMutation<
    CreateNoteMoodInput,
    CreateNoteMoodMutationVariables
  >(CREATE_NOTE_MOOD);

  const toggleMood = async (mood: string) => {
    if (!noteId) return;
    try {
      createNoteMood({
        variables: {
          data: {
            noteId,
            descriptor: mood.replace(/ |\/+/g, '_').toUpperCase(),
          },
        },
      });
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
