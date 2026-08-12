import { Colors } from '@monorepo/expo/shared/static';
import { TModalPresentationType } from '../../providers';
import { HeaderLeftButton } from '../HeaderLeftButton';
import { defaultModalNavOpts } from './config';
import { getModalCloseBtn } from './getModalCloseBtn';

type TProps = {
  title?: string;
  presentation?: TModalPresentationType;
  hideHeader?: boolean;
  onClose?: null | (() => void);
  headerCloseLabel?: string;
};

export function getDefaultStackModalOptions(props?: TProps) {
  const { presentation, hideHeader, title, onClose, headerCloseLabel } =
    props || {};

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
      headerRight: onClose
        ? () => getModalCloseBtn({ onClose, label: headerCloseLabel })
        : undefined,
    };
  }

  if (presentation === 'fullScreenModal') {
    return {
      ...defaultModalNavOpts.fullScreenModal,
      presentation,
      title: title || '',
      headerRight: onClose
        ? () => getModalCloseBtn({ onClose, label: headerCloseLabel })
        : undefined,
    };
  }

  return {
    ...defaultModalNavOpts.card,
    presentation,
    title: title || '',
    headerLeft: () => <HeaderLeftButton title="Close" color={Colors.WHITE} />,
  };
}
