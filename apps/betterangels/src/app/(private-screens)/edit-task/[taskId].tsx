import {
  MainScrollContainer,
  useViewTaskQuery,
} from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import DueBy from './DueBy';
import Location from './Location';
import Title from './Title';

export default function EditTask() {
  const { taskId } = useLocalSearchParams<{
    taskId: string;
  }>();

  if (!taskId) {
    throw new Error('Something went wrong. Please try again.');
  }
  const { data, loading: isLoading } = useViewTaskQuery({
    variables: { id: taskId },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

  const [expanded, setExpanded] = useState<undefined | string | null>();
  const scrollRef = useRef<ScrollView>(null);

  const props = {
    expanded,
    setExpanded,
    taskId,
    scrollRef,
  };

  if (!data || isLoading) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <MainScrollContainer>
        {/* <PublicNote title={data.task.title} {...props} /> */}
        <Title title={data.task.title} {...props} />
        <Location
          address={data.task.location?.address}
          point={data.task.location?.point}
          {...props}
        />
        <DueBy dueBy={data.task.dueBy} {...props} />
      </MainScrollContainer>
    </View>
  );
}
