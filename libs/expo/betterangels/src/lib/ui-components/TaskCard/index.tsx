import { ChevronRightIcon, FlagIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Checkbox, TextRegular } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { TaskStatusEnum, TasksQuery } from '../../apollo';
interface ITaskCardProps {
  task: TasksQuery['tasks'][0];
}
export default function TaskCard(props: ITaskCardProps) {
  const { task } = props;
  const router = useRouter();
  const [isChecked, setIsChecked] = useState(
    task.status === TaskStatusEnum.Completed ? true : false
  );

  const handleCheck = () => {
    setIsChecked(!isChecked);
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.navigate(`/task/${task.id}`)}
      style={styles.container}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Checkbox
          accessibilityHint={task.title}
          isChecked={isChecked}
          onCheck={handleCheck}
          mr="sm"
          size="md"
        />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.flagIcon}>
            <FlagIcon color={Colors.PRIMARY_EXTRA_DARK} />
          </View>
        </View>
        <TextRegular>{task.title}</TextRegular>
        <View style={styles.chevronIcon}>
          <ChevronRightIcon color={Colors.PRIMARY_EXTRA_DARK} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.WHITE,
    padding: Spacings.sm,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  chevronIcon: {
    position: 'absolute',
    right: 0,
  },
  flagIcon: {
    marginRight: Spacings.xs,
  },
});
