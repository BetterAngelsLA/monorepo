import { headerVariants } from './config';
import { HeaderLeftButton } from './HeaderLeftButton';

type TProps = {
  title?: string;
};

export function getDefaultStackNavOptions(props?: TProps) {
  const { title } = props || {};

  // Only the background is taken from the shared config: adding
  // `headerTitleStyle` here would change the title colour on every pushed
  // screen, which is a separate call from consolidating the colours.
  return {
    headerTitleAlign: 'center',
    title: title || '',
    headerStyle: {
      backgroundColor: headerVariants.default.backgroundColor,
    },
    headerLeft: () => <HeaderLeftButton />,
  } as const;
}
