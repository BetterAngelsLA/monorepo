import { Colors } from '@monorepo/expo/shared/static';
import { TModalHeaderConfig, TModalPresentationType } from '../../providers';
import { HeaderLeftButton } from '../HeaderLeftButton';
import { getNativeHeaderOptions } from '../utils';
import { getModalCloseBtn } from './getModalCloseBtn';

type TProps = {
  title?: string;
  presentation?: TModalPresentationType;
  onClose?: null | (() => void);
  /** Header configuration, as passed to `showModalScreen`. */
  header?: TModalHeaderConfig;
};

export function getDefaultStackModalOptions(props?: TProps) {
  const { presentation, title, onClose, header } = props || {};

  const headerMode = header?.mode;

  // Anything but `native` is rendered by the screen itself (or not at all) —
  // the native bar stays off.
  if (headerMode !== undefined && headerMode !== 'native') {
    return {
      presentation,
      headerShown: false,
    };
  }

  // Native header. Its look comes from the shared `screen` style; the buttons
  // follow the presentation: a pushed `card` screen gets Close on the left,
  // both modal presentations get a close on the right.
  if (presentation === 'card') {
    return {
      ...getNativeHeaderOptions('screen'),
      presentation,
      title: title || '',
      headerLeft: () => <HeaderLeftButton title="Close" color={Colors.WHITE} />,
    };
  }

  return {
    ...getNativeHeaderOptions('screen'),
    presentation,
    title: title || '',
    // Native-header-only: suppresses the back chevron expo-router would
    // otherwise draw for a pushed route.
    headerBackVisible: false,
    headerRight: onClose
      ? () => getModalCloseBtn({ onClose, label: header?.closeLabel })
      : undefined,
  };
}
