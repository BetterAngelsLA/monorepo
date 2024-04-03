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
import { debounce } from '@monorepo/expo/shared/utils';
import { ComponentType, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

type Mood = {
  Icon: ComponentType<IIconProps>;
  title: string;
  enum: MoodEnum;
  id?: string;
  tab: 'pleasant' | 'neutral' | 'unpleasant';
};

interface MoodCheckboxProps {
  mood: Mood;
  idx: number;
  noteId: string | undefined;
  tab: 'pleasant' | 'neutral' | 'unpleasant';
  setMoods: (
    e: {
      enum: MoodEnum;
      title: string;
    }[]
  ) => void;
  moods: {
    enum: MoodEnum;
    title: string;
  }[];
}

export default function MoodCheckbox(props: MoodCheckboxProps) {
  const { mood, idx, noteId, tab, moods, setMoods } = props;
  const [isChecked, setIsChecked] = useState(false);
  const [moodId, setMoodId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const [createNoteMood, { error }] = useMutation<
    CreateNoteMoodMutation,
    CreateNoteMoodMutationVariables
  >(CREATE_NOTE_MOOD);
  const [deleteMood, { error: deleteError }] = useMutation<
    DeleteMoodMutation,
    DeleteMoodMutationVariables
  >(DELETE_MOOD);

  const executeMutation = useCallback(async () => {
    if (!noteId) return;

    if (isChecked && moodId) {
      const { data } = await deleteMood({
        variables: {
          data: { id: moodId },
        },
      });
      if (!data) {
        console.log('Error deleting mood', deleteError);
        return;
      }
      setMoodId(undefined);
    } else if (!isChecked && noteId) {
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
  }, [
    noteId,
    isChecked,
    moodId,
    deleteMood,
    deleteError,
    createNoteMood,
    mood.enum,
    error,
  ]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedExecuteMutation = useCallback(debounce(executeMutation, 300), [
    executeMutation,
  ]);

  const handleCheck = () => {
    if (isLoading) return;
    setIsLoading(true);
    setIsChecked((prev) => !prev);
    const newMoods = moodId
      ? moods.filter((m) => m.enum !== mood.enum)
      : [...moods, { title: mood.title, enum: mood.enum }];
    setMoods(newMoods);
    debouncedExecuteMutation();
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
          <BodyText ml="xs">{mood.title}</BodyText>
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
