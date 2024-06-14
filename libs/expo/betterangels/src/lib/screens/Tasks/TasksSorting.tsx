import { Spacings } from '@monorepo/expo/shared/static';
import { TextMedium } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { TasksQuery } from '../../apollo';

interface IInteractionsSortingProps {
  tasks: TasksQuery['tasks'] | undefined;
}

export default function InteractionsSorting(props: IInteractionsSortingProps) {
  const { tasks } = props;

  return (
    <View
      style={{
        marginBottom: Spacings.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <TextMedium size="lg">
        {tasks?.length} task
        {tasks?.length === 1 ? '' : 's'}
      </TextMedium>
    </View>
  );
}
