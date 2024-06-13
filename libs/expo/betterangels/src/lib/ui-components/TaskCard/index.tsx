import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TasksQuery } from '../../apollo';

interface ITaskCardProps {
  task: TasksQuery['tasks'][0];
}
export default function TaskCard(props: ITaskCardProps) {
  const { task } = props;
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.navigate(`/task/${task.id}`)}
      style={styles.container}
    >
      <View>
        <Text>I'm a task card</Text>
        {/* <Text>{task.title}</Text> */}
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
