import { useMutation } from '@apollo/client';
import {
  CREATE_NOTE_MOOD,
  CreateNoteMoodMutation,
  CreateNoteMoodMutationVariables,
  DELETE_MOOD,
  DeleteMoodMutation,
  DeleteMoodMutationVariables,
  MoodEnum,
} from '@monorepo/expo/betterangels';
import { IIconProps } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { BodyText, Checkbox } from '@monorepo/expo/shared/ui-components';

import React, { ComponentType } from 'react';
import { useFormContext } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

interface Mood {
  Icon: ComponentType<IIconProps>;
  title: string;
  enum: MoodEnum;
  id?: string;
}

interface MoodSelectorProps {
  moodsData: Mood[];
  noteId: string | undefined;
}

const MoodSelector: React.FC<MoodSelectorProps> = ({ moodsData, noteId }) => {
  const { setValue, watch } = useFormContext();
  const selectedMoods = watch('moods') || [];
  const [deleteMood] = useMutation<
    DeleteMoodMutation,
    DeleteMoodMutationVariables
  >(DELETE_MOOD);
  const [createNoteMood] = useMutation<
    CreateNoteMoodMutation,
    CreateNoteMoodMutationVariables
  >(CREATE_NOTE_MOOD);

  const toggleMood = async (mood: Mood) => {
    if (!noteId) return;
    try {
      if (
        selectedMoods
          .map((selected: Mood) => selected.title)
          .includes(mood.title)
      ) {
        if (!mood.id) throw new Error('Unexpected Error!');
        deleteMood({
          variables: {
            data: {
              id: mood.id,
            },
          },
        });
        const newMoods = selectedMoods.filter(
          (selected: Mood) => selected.title !== mood.title
        );
        setValue('moods', newMoods);
      } else {
        const { data } = await createNoteMood({
          variables: {
            data: {
              noteId,
              descriptor: mood.enum,
            },
          },
        });

        if (data?.createNoteMood.__typename === 'MoodType') {
          const newMood = {
            title: mood.title,
            enum: mood.enum,
            id: data.createNoteMood.id,
          };

          const newMoods = [...selectedMoods, newMood];
          setValue('moods', newMoods);
        } else if (data?.createNoteMood.__typename === 'OperationInfo') {
          console.log(data.createNoteMood.messages);
        }
      }
    } catch (e) {
      console.log('Error updating note mood', e);
    }
  };

  return (
    <View>
      {moodsData.map((mood, idx) => (
        <Checkbox
          isChecked={selectedMoods
            .map((selected: Mood) => selected.title)
            .includes(mood.title)}
          mt={idx !== 0 ? 'xs' : undefined}
          key={mood.title}
          hasBorder
          onCheck={() => toggleMood(mood)}
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
