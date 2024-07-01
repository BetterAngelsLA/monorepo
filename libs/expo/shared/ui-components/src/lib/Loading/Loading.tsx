import { ActivityIndicator, ActivityIndicatorProps } from 'react-native';

type ILoadingPorps = ActivityIndicatorProps;

export function Loading(props: ILoadingPorps) {
  return <ActivityIndicator {...props} />;
}
