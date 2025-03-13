import { Colors } from '@monorepo/expo/shared/static';
import { View } from 'react-native';
import Loading from '../Loading';

export function LoadingView() {
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
