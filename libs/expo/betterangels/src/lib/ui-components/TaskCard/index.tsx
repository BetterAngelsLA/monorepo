import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Checkbox, TextRegular } from '@monorepo/expo/shared/ui-components';
import { debounce } from '@monorepo/expo/shared/utils';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  TaskStatusEnum,
  TasksQuery,
  useUpdateTaskMutation,
} from '../../apollo';
interface ITaskCardProps {
  task: TasksQuery['tasks'][0];
}
export default function TaskCard(props: ITaskCardProps) {
  const { task } = props;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isChecked, setIsChecked] = useState(
    task.status === TaskStatusEnum.Completed ? true : false
  );
  console.log(task.id, 'isChecked', isChecked);
  const [updateTask, { error: updateError }] = useUpdateTaskMutation();

  const executeMutation = useRef(
    debounce(async (id, checked) => {
      if (!id) return;
      console.log('ID', id);
      try {
        if (id && checked) {
          console.log('ON', checked);
          const { data } = await updateTask({
            variables: {
              data: {
                id,
                status: TaskStatusEnum.Completed,
              },
            },
          });
          if (!data) {
            console.log('Error updating task', updateError);
          }
        } else if (id && !checked) {
          console.log('OFF', checked);
          const { data } = await updateTask({
            variables: {
              data: {
                id,
                status: TaskStatusEnum.ToDo,
              },
            },
          });
          if (!data) {
            console.log('Error updating task', updateError);
          }
        }
      } catch (err) {
        setIsLoading(false);
        console.log('Error creating task', err);
      }
    }, 300)
  ).current;

  const handleCheck = () => {
    if (isLoading) return;
    setIsLoading(true);
    setIsChecked(!isChecked);
    console.log('handleCheck', task.id, 'isChecked', isChecked);
    executeMutation(task.id, !isChecked);
  };

  // if (isLoading) return;
  // setIsLoading(true);
  // setIsChecked(!isChecked);
  // const newMoods = moodId
  //   ? moods.filter((m) => m.enum !== mood.enum)
  //   : [...moods, { enum: mood.enum, id: undefined }];

  // setMoods(newMoods);
  // executeMutation(!isChecked, moodId);
  console.log(task.title);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.navigate(`/task/${task.id}`)}
      style={styles.container}
    >
      <View style={{ flexDirection: 'row', flex: 2 }}>
        <Checkbox
          accessibilityHint={task.title}
          isChecked={isChecked}
          onCheck={handleCheck}
          mr="xs"
        />
        <TextRegular>{task.title}</TextRegular>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacings.sm,
    gap: Spacings.xs,
    borderRadius: 8,
    backgroundColor: Colors.WHITE,
  },
});
