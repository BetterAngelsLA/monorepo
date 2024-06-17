import {
  MainScrollContainer,
  useViewTaskQuery,
} from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import Location from './Location';

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
        <Location
          address={data.task.location?.address}
          point={data.task.location?.point}
          {...props}
        />
      </MainScrollContainer>
    </View>
  );
}
