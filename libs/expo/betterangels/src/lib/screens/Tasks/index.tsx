import { Colors } from '@monorepo/expo/shared/static';
import { Text } from 'react-native';
import { TaskStatusEnum } from '../../apollo';
import { MainContainer, TaskCard } from '../../ui-components';

export default function Tasks() {
  return (
    <MainContainer pb={0} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <Text>Tasks</Text>
      <TaskCard
        task={{
          id: '1',
          summary: 'This is a task',
          description: 'This is a description',
          status: TaskStatusEnum.ToDo,
          createdAt: new Date().toISOString(),
          updatedAt: new Date(),
          createdBy: {
            id: '1',
            firstName: 'John',
            lastName: 'Doe',
            username: 'test',
          },
        }}
      />
    </MainContainer>
  );
}
