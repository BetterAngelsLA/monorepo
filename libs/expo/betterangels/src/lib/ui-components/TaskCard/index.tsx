import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Checkbox, TextRegular } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { TasksQuery, useUpdateTaskMutation } from '../../apollo';

interface ITaskCardProps {
  task: TasksQuery['tasks'][0];
}
export default function TaskCard(props: ITaskCardProps) {
  const { task } = props;
  const router = useRouter();

  const [updateTask, { error: updateError }] = useUpdateTaskMutation();

  // const handleCheck = () => {
  //   if (isLoading) return;
  //   setIsLoading(true);
  //   setIsChecked(!isChecked);
  //   const newMoods = moodId
  //     ? moods.filter((m) => m.enum !== mood.enum)
  //     : [...moods, { enum: mood.enum, id: undefined }];

  //   setMoods(newMoods);
  //   executeMutation(!isChecked, moodId);
  // };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.navigate(`/task/${task.id}`)}
      style={styles.container}
    >
      <View style={{ flexDirection: 'row', flex: 2 }}>
        <Checkbox
          isChecked={task.status === 'COMPLETED' ? true : false}
          // onCheck={handleCheck}
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
