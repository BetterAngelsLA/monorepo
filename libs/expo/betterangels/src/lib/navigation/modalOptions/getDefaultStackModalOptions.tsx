import { Colors } from '@monorepo/expo/shared/static';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { TModalPresentationType } from '../../providers';
import { HeaderLeftButton } from '../HeaderLeftButton';
import { defaultModalNavOpts } from './config';
import { getModalCloseBtn } from './getModalCloseBtn';

type TProps = {
  title?: string;
  presentation?: TModalPresentationType;
  hideHeader?: boolean;
  onClose?: null | (() => void);
};

export function getDefaultStackModalOptions(
  props?: TProps
): NativeStackNavigationOptions {
  const { presentation, hideHeader, title, onClose } = props || {};

  if (hideHeader) {
    return {
      presentation,
      headerShown: false,
    };
  }

  if (presentation === 'modal') {
    return {
      ...defaultModalNavOpts.modal,
      presentation,
      title: title || '',
      headerRight: onClose ? () => getModalCloseBtn({ onClose }) : undefined,
    };
  }

  if (presentation === 'fullScreenModal') {
    return {
      ...defaultModalNavOpts.fullScreenModal,
      presentation,
      title: title || '',
      headerRight: onClose ? () => getModalCloseBtn({ onClose }) : undefined,
    };
  }

  return {
    ...defaultModalNavOpts.card,
    presentation,
    title: title || '',
    headerLeft: () => <HeaderLeftButton title="Close" color={Colors.WHITE} />,
  };
}
