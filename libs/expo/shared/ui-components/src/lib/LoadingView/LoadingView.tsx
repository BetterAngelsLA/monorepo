import { Colors } from '@monorepo/expo/shared/static';
import { View } from 'react-native';
import Loading from '../Loading';
import { FullscreenLoadingModal } from './LoadingViewFullScreen';

type TProps = {
  fullScreen?: boolean;
};

export function LoadingView(props: TProps) {
  const { fullScreen } = props;

  if (fullScreen) {
    return <FullscreenLoadingModal />;
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Loading size="large" />
    </View>
  );
}
