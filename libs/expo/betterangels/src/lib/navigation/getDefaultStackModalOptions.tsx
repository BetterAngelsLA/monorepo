import { Colors } from '@monorepo/expo/shared/static';
import { CloseButton } from '@monorepo/expo/shared/ui-components';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { HeaderLeftButton } from './HeaderLeftButton';

type TProps = {
  title?: string;
  presentation?: 'modal' | 'card';
  hideHeader?: boolean;
  onClose?: () => void;
};

export function getDefaultStackModalOptions(
  props?: TProps
): NativeStackNavigationOptions {
  const { presentation, hideHeader } = props || {};

  if (hideHeader) {
    return {
      presentation,
      headerShown: false,
    };
  }

  if (presentation === 'modal') {
    return modalOptions(props);
  }

  return cardOptions(props);
}

function cardOptions(props?: TProps): NativeStackNavigationOptions {
  const { title } = props || {};

  return {
    presentation: 'card',
    headerTitleAlign: 'center',
    title: title || '',
    headerStyle: {
      backgroundColor: Colors.WHITE,
    },
    headerTitleStyle: {
      color: Colors.BRAND_DARK_BLUE,
    },
    headerLeft: () => (
      <HeaderLeftButton title="Close" color={Colors.BRAND_DARK_BLUE} />
    ),
  };
}

function modalOptions(props?: TProps): NativeStackNavigationOptions {
  const { title, onClose } = props || {};

  const baseOpts: NativeStackNavigationOptions = {
    presentation: 'modal',
    headerTitleAlign: 'center',
    title: title || '',
    headerStyle: {
      backgroundColor: Colors.WHITE,
    },
    headerTitleStyle: {
      color: Colors.BRAND_DARK_BLUE,
    },
    headerBackVisible: false,
  };

  if (onClose) {
    baseOpts.headerRight = () => <CloseButton onClose={onClose} />;
  }

  return baseOpts;
}
