import { Colors } from '@monorepo/expo/shared/static';
import { TextBold } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { SectionList } from 'react-native';
import { TasksQuery, useTasksQuery } from '../../apollo';
import { MainContainer, TaskCard } from '../../ui-components';

const paginationLimit = 10;

interface IGroupedTasks {
  [key: string]: {
    title: string;
    data: TasksQuery['tasks'];
  };
}

export default function Tasks() {
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const { data, loading } = useTasksQuery({
    variables: {
      pagination: { limit: paginationLimit + 1, offset },
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });
  const [tasks, setTasks] = useState<IGroupedTasks>({});

  const router = useRouter();

  function loadMoreTasks() {
    if (hasMore && !loading) {
      setOffset((prevOffset) => prevOffset + paginationLimit);
    }
  }

  useEffect(() => {
    if (!data || !('tasks' in data)) return;

    const tasksToShow = data.tasks.slice(0, paginationLimit);
    const isMoreAvailable = data.tasks.length > tasksToShow.length;

    const groupedContacts = tasksToShow.reduce((acc: IGroupedTasks, task) => {
      const firstLetter = task.title.charAt(0).toUpperCase() || '#';

      if (!acc[firstLetter]) {
        acc[firstLetter] = {
          title: firstLetter,
          data: [],
        };
      }
      acc[firstLetter].data.push(task);
      return acc;
    }, {});

    setTasks((prevTasks) => {
      if (offset === 0) {
        return groupedContacts;
      }

      const mergedTasks = { ...prevTasks };

      Object.keys(groupedContacts).forEach((key) => {
        if (mergedTasks[key]) {
          mergedTasks[key].data = [
            ...mergedTasks[key].data,
            ...groupedContacts[key].data,
          ];
        } else {
          mergedTasks[key] = groupedContacts[key];
        }
      });

      return mergedTasks;
    });

    setHasMore(isMoreAvailable);
  }, [data, offset]);

  const sections = useMemo(() => Object.values(tasks || {}), [tasks]);

  return (
    <MainContainer bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <SectionList
        style={{
          flex: 1,
        }}
        sections={sections}
        renderItem={({ item: task }) =>
          tasks ? <TaskCard task={task} /> : null
        }
        renderSectionHeader={({ section: { title } }) => (
          <TextBold mb="xs" size="sm">
            {title}
          </TextBold>
        )}
        keyExtractor={(task) => task.id}
        onEndReached={loadMoreTasks}
        onEndReachedThreshold={0.05}
      />
    </MainContainer>
  );
}
