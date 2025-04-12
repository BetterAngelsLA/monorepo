import { Colors } from '@monorepo/expo/shared/static';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { HeaderLeftButton } from './HeaderLeftButton';

type TProps = {
  title?: string;
};

export function getDefaultStackNavOptions(
  props?: TProps
): NativeStackNavigationOptions {
  const { title } = props || {};

  return {
    headerTitleAlign: 'center',
    title: title || '',
    headerStyle: {
      backgroundColor: Colors.BRAND_DARK_BLUE,
    },
    headerLeft: () => <HeaderLeftButton />,
  };
}
