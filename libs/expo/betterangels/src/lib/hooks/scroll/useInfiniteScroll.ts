import { useCallback } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

type UseInfiniteScrollProps = {
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  threshold?: number;
};

export default function useInfiniteScroll({
  loading,
  hasMore,
  onLoadMore,
  threshold = 20,
}: UseInfiniteScrollProps) {
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } =
        event.nativeEvent;
      if (
        layoutMeasurement.height + contentOffset.y >=
          contentSize.height - threshold &&
        !loading &&
        hasMore
      ) {
        onLoadMore();
      }
    },
    [loading, hasMore, onLoadMore, threshold]
  );

  return { handleScroll };
}
