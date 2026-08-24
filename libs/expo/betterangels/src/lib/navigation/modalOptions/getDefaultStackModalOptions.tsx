import { Colors } from '@monorepo/expo/shared/static';
import { TModalPresentationType } from '../../providers';
import { HeaderLeftButton } from '../HeaderLeftButton';
import { THeaderVariant } from '../types';
import { getNativeHeaderOptions } from '../utils';
import { getModalCloseBtn } from './getModalCloseBtn';

type TProps = {
  title?: string;
  presentation?: TModalPresentationType;
  hideHeader?: boolean;
  onClose?: null | (() => void);
  headerCloseLabel?: string;
};

/**
 * Which header a modal presentation gets. `card` is a pushed screen, so it takes
 * the default bar (with Close in place of Back); both modal presentations take
 * the modal bar.
 */
function getHeaderVariant(props: TProps): THeaderVariant {
  const { presentation, hideHeader } = props;

  if (hideHeader) {
    return 'none';
  }

  return presentation === 'card' ? 'default' : 'modal';
}

export function getDefaultStackModalOptions(props?: TProps) {
  const { presentation, title, onClose, headerCloseLabel } = props || {};

  const variant = getHeaderVariant(props || {});

  if (variant === 'none') {
    return {
      presentation,
      headerShown: false,
    };
  }

  if (variant === 'modal') {
    return {
      ...getNativeHeaderOptions(variant),
      presentation,
      title: title || '',
      // Native-header-only: suppresses the back chevron expo-router would
      // otherwise draw for a pushed route.
      headerBackVisible: false,
      headerRight: onClose
        ? () => getModalCloseBtn({ onClose, label: headerCloseLabel })
        : undefined,
    };
  }

  return {
    ...getNativeHeaderOptions('default'),
    presentation,
    title: title || '',
    headerLeft: () => <HeaderLeftButton title="Close" color={Colors.WHITE} />,
  };
}
