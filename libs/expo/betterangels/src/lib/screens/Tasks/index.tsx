// import { Spacings } from '@monorepo/expo/shared/static';
// import { Loading } from '@monorepo/expo/shared/ui-components';
// import { useEffect, useState } from 'react';
// import { FlatList, RefreshControl, View } from 'react-native';
// import { Colors } from 'react-native/Libraries/NewAppScreen';
// import { TasksQuery, useTasksQuery } from '../../apollo';
// import useUser from '../../hooks/user/useUser';
// import { MainContainer, TaskCard } from '../../ui-components';
// import TasksHeader from './TasksHeader';

import { useEffect, useState } from 'react';
import { useTasksQuery } from '../../apollo';
import { TaskCard } from '../../ui-components';

export default function Tasks() {
  const { data, loading, error, refetch } = useTasksQuery({
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });
  const [tasks, setTasks] = useState<TasksQuery['tasks']>([]);
  console.log(tasks);

  useEffect(() => {
    if (!data || !('tasks' in data)) return;

    setTasks(data.tasks);
  }, [data]);

  if (error) {
    console.log(error);
    throw new Error('Something went wrong!');
  }

  return (
    <TaskCard />
    // <MainContainer bg={Colors.NEUTRAL_EXTRA_LIGHT}>
    //   <TasksHeader search={search} setSearch={setSearch} />
    //   <FlatList
    //     refreshControl={
    //       <RefreshControl
    //         refreshing={refreshing}
    //         onRefresh={onRefresh}
    //         tintColor={Colors.PRIMARY}
    //       />
    //     }
    //     ItemSeparatorComponent={() => <View style={{ height: Spacings.xs }} />}
    //     data={tasks}
    //     renderItem={({ item: task }) => <TaskCard task={task} />}
    //     keyExtractor={(task) => task.id}
    //     ListFooterComponent={() =>
    //       loading ? (
    //         <View style={{ marginTop: 10, alignItems: 'center' }}>
    //           <Loading size="large" color={Colors.NEUTRAL_DARK} />
    //         </View>
    //       ) : null
    //     }
    //     onEndReached={loadMoreTasks}
    //     onEndReachedThreshold={0.5}
    //   />
    // </MainContainer>
  );
}
