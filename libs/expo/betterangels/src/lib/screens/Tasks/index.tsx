import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { TasksQuery, useTasksQuery } from '../../apollo';
import { MainContainer, TaskCard } from '../../ui-components';
import TasksSorting from './TasksSorting';

const paginationLimit = 10;

export default function Tasks() {
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const { data, loading, error, refetch } = useTasksQuery({
    variables: {
      pagination: { limit: paginationLimit + 1, offset: offset },
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });
  const [tasks, setTasks] = useState<TasksQuery['tasks']>([]);
  const [refreshing, setRefreshing] = useState(false);

  function loadMoreTasks() {
    if (hasMore && !loading) {
      setOffset((prevOffset) => prevOffset + paginationLimit);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    setOffset(0);
    try {
      const response = await refetch({
        pagination: { limit: paginationLimit + 1, offset: 0 },
      });
      const isMoreAvailable =
        response.data &&
        'tasks' in response.data &&
        response.data.tasks.length > paginationLimit;
      setHasMore(isMoreAvailable);
    } catch (err) {
      console.error(err);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    if (!data || !('tasks' in data)) return;

    const tasksToShow = data.tasks.slice(0, paginationLimit);
    const isMoreAvailable = data.tasks.length > tasksToShow.length;

    if (offset === 0) {
      setTasks(tasksToShow);
    } else {
      setTasks((prevTasks) => [...prevTasks, ...tasksToShow]);
    }

    // TODO: @mikefeldberg - this is a temporary solution until backend provides a way to know if there are more tasks
    setHasMore(isMoreAvailable);
  }, [data, offset]);

  if (error) {
    console.log(error);
    throw new Error('Something went wrong!');
  }

  return (
    // <TaskCard />
    <MainContainer bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      {/* <TasksHeader search={search} setSearch={setSearch} /> */}
      <TasksSorting tasks={tasks} />
      <View>
        {tasks.map((task, idx) => (
          <View
            style={{ marginTop: idx !== 0 ? Spacings.xs : 0 }}
            key={task.title}
          >
            <TaskCard key={idx} task={task} />
          </View>
        ))}
      </View>

      {/* <FlatList
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.PRIMARY}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: Spacings.xs }} />}
        data={tasks}
        renderItem={({ item: task }) => <TaskCard task={task} />}
        keyExtractor={(task) => task.id}
        ListFooterComponent={() =>
          loading ? (
            <View style={{ marginTop: 10, alignItems: 'center' }}>
              <Loading size="large" color={Colors.NEUTRAL_DARK} />
            </View>
          ) : null
        }
        onEndReached={loadMoreTasks}
        onEndReachedThreshold={0.5}
      /> */}
    </MainContainer>
  );
}
