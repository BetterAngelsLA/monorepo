import { useMutation } from '@apollo/client';
import {
  CREATE_NOTE_MOOD,
  CreateNoteMoodMutation,
  CreateNoteMoodMutationVariables,
  DELETE_MOOD,
  DeleteMoodMutation,
  DeleteMoodMutationVariables,
  MoodEnum,
  debounce,
} from '@monorepo/expo/betterangels';
import { IIconProps } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { BodyText, Checkbox } from '@monorepo/expo/shared/ui-components';
import { ComponentType, useCallback, useEffect, useState } from 'react';
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

  const [createNoteMood] = useMutation<
    CreateNoteMoodMutation,
    CreateNoteMoodMutationVariables
  >(CREATE_NOTE_MOOD);
  const [deleteMood] = useMutation<
    DeleteMoodMutation,
    DeleteMoodMutationVariables
  >(DELETE_MOOD);

  const toggleMood = useCallback(() => {
    const executeMutation = async () => {
      if (!noteId) return;
      if (isChecked) {
        createNoteMood({
          variables: {
            data: {
              noteId,
              descriptor: mood.enum,
            },
          },
        })
          .then((response) => {
            if (response.data?.createNoteMood.__typename === 'MoodType') {
              const createdMoodId = response.data?.createNoteMood.id;
              if (createdMoodId) {
                setMoodId(createdMoodId);
                setIsLoading(false);
              }
            } else if (
              response.data?.createNoteMood.__typename === 'OperationInfo'
            ) {
              console.log(response.data.createNoteMood.messages);
            }
          })
          .catch((error) => {
            console.error('Error creating mood', error);
          });
      } else {
        if (moodId) {
          deleteMood({
            variables: {
              data: {
                id: moodId,
              },
            },
          })
            .then(() => {
              setMoodId(undefined);
              setIsLoading(false);
            })
            .catch((error) => {
              console.error('Error deleting mood', error);
            });
        }
      }
    };
    debounce(executeMutation, 500)();
  }, [isChecked, noteId, mood.enum, createNoteMood, deleteMood]);

  useEffect(() => {
    const debouncedToggle = debounce(toggleMood, 300);
    debouncedToggle();
  }, [toggleMood]);

  const handleCheck = () => {
    if (isLoading) return;
    setIsLoading(true);
    setIsChecked((prev) => !prev);
    const newMoods = moodId
      ? moods.filter((m) => m.enum !== mood.enum)
      : [...moods, { Icon: mood.Icon, title: mood.title, enum: mood.enum }];
    setMoods(newMoods);
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
