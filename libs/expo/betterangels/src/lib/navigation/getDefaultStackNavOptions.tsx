import { Colors } from '@monorepo/expo/shared/static';
import { HeaderLeftButton } from './HeaderLeftButton';

type TProps = {
  title?: string;
};

export function getDefaultStackNavOptions(
  props?: TProps
) {
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
