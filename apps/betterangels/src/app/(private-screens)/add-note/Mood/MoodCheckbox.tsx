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
import { Checkbox, TextRegular } from '@monorepo/expo/shared/ui-components';
import { debounce } from '@monorepo/expo/shared/utils';
import { ComponentType, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

type Mood = {
  Icon: ComponentType<IIconProps>;
  title: string;
  enum: MoodEnum;
  id?: string;
  tab: 'pleasant' | 'neutral' | 'unpleasant';
};

interface MoodCheckboxProps {
  id: string | undefined;
  mood: Mood;
  idx: number;
  noteId: string | undefined;
  tab: 'pleasant' | 'neutral' | 'unpleasant';
  setMoods: (
    moods: {
      enum: MoodEnum;
      id: string | undefined;
    }[]
  ) => void;
  moods: {
    enum: MoodEnum;
    id: string | undefined;
  }[];
}

export default function MoodCheckbox(props: MoodCheckboxProps) {
  const { mood, idx, noteId, tab, moods, setMoods, id } = props;
  const [isChecked, setIsChecked] = useState(id ? true : false);
  const [moodId, setMoodId] = useState<string | undefined>(id || undefined);
  const [isLoading, setIsLoading] = useState(false);

  const [createNoteMood, { error }] = useMutation<
    CreateNoteMoodMutation,
    CreateNoteMoodMutationVariables
  >(CREATE_NOTE_MOOD);
  const [deleteMood, { error: deleteError }] = useMutation<
    DeleteMoodMutation,
    DeleteMoodMutationVariables
  >(DELETE_MOOD);

  const executeMutation = useRef(
    debounce(async (checked, currentId) => {
      if (!noteId) return;

      if (!checked && currentId) {
        const { data } = await deleteMood({
          variables: {
            data: { id: currentId },
          },
        });
        if (!data) {
          console.log('Error deleting mood', deleteError);
          return;
        }
        setMoodId(undefined);
      } else if (checked) {
        const { data } = await createNoteMood({
          variables: {
            data: {
              noteId,
              descriptor: mood.enum,
            },
          },
        });
        if (!data) {
          console.log('Error creating mood', error);
          return;
        }
        if ('id' in data.createNoteMood) {
          setMoodId(data.createNoteMood.id);
        }
      }
      setIsLoading(false);
    }, 300)
  ).current;

  const handleCheck = () => {
    if (isLoading) return;
    setIsLoading(true);
    setIsChecked(!isChecked);
    const newMoods = moodId
      ? moods.filter((m) => m.enum !== mood.enum)
      : [...moods, { enum: mood.enum, id: undefined }];

    setMoods(newMoods);
    executeMutation(!isChecked, moodId);
  };

  if (tab !== mood.tab) return null;

  return (
    <Checkbox
      isChecked={isChecked}
      mt={idx !== 0 ? 'xs' : undefined}
      hasBorder
      onCheck={handleCheck}
      accessibilityHint={mood.title}
      label={
        <View style={styles.labelContainer}>
          <mood.Icon color={Colors.PRIMARY_EXTRA_DARK} size="md" />
          <TextRegular ml="xs">{mood.title}</TextRegular>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
