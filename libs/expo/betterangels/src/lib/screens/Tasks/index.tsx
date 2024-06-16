import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextBold } from '@monorepo/expo/shared/ui-components';
import { useEffect, useMemo, useState } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';
import { Ordering, TasksQuery, useTasksQuery } from '../../apollo';
import { MainContainer, TaskCard } from '../../ui-components';
import TasksHeader from './TasksHeader';
const paginationLimit = 10;

interface IGroupedTasks {
  [key: string]: {
    title: string;
    data: TasksQuery['tasks'];
  };
}

export default function Tasks() {
  const [search, setSearch] = useState<string>('');
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const { data, loading } = useTasksQuery({
    variables: {
      pagination: { limit: paginationLimit + 1, offset },
      order: {
        dueBy: Ordering.AscNullsLast,
      },
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });
  const [tasks, setTasks] = useState<IGroupedTasks>({});

  function loadMoreTasks() {
    if (hasMore && !loading) {
      setOffset((prevOffset) => prevOffset + paginationLimit);
    }
  }

  useEffect(() => {
    if (!data || !('tasks' in data)) return;

    const tasksToShow = data.tasks.slice(0, paginationLimit);
    const isMoreAvailable = data.tasks.length > tasksToShow.length;

    const groupedTasks = tasksToShow.reduce((acc: IGroupedTasks, task) => {
      const dueWithin = task.dueWithin;
      console.log('dueWithin', dueWithin);
      if (!acc[dueWithin]) {
        acc[dueWithin] = {
          title: dueWithin
            .toLowerCase()
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' '),
          data: [],
        };
      }
      acc[dueWithin].data.push(task);
      return acc;
    }, {});

    setTasks((prevTasks) => {
      if (offset === 0) {
        return groupedTasks;
      }

      const mergedTasks = { ...prevTasks };

      Object.keys(groupedTasks).forEach((key) => {
        if (mergedTasks[key]) {
          mergedTasks[key].data = [
            ...mergedTasks[key].data,
            ...groupedTasks[key].data,
          ];
        } else {
          mergedTasks[key] = groupedTasks[key];
        }
      });

      return mergedTasks;
    });

    setHasMore(isMoreAvailable);
  }, [data, offset]);

  const sections = useMemo(() => Object.values(tasks || {}), [tasks]);

  return (
    <MainContainer bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <TasksHeader search={search} setSearch={setSearch} />
      <SectionList
        style={{
          flex: 1,
        }}
        sections={sections}
        renderItem={({ item: task }) =>
          tasks ? <TaskCard task={task} /> : null
        }
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <TextBold mt="sm" size="xl">
              {title}
            </TextBold>
            {/* <Text>{title}</Text> */}
          </View>
        )}
        keyExtractor={(task) => task.id}
        onEndReached={loadMoreTasks}
        onEndReachedThreshold={0.05}
        SectionSeparatorComponent={() => (
          <View style={styles.sectionSeparator} />
        )}
        ItemSeparatorComponent={() => (
          <View style={{ marginBottom: -Spacings.xs }} />
        )}
      />
    </MainContainer>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    paddingLeft: Spacings.sm,
    marginBottom: -Spacings.xs,
    backgroundColor: Colors.WHITE,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  sectionSeparator: {
    marginBottom: Spacings.xs,
  },
});
