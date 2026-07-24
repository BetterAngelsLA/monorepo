import {
  CallOutlinedIcon,
  CopyIcon,
  EmailIcon,
  MapLineIcon,
} from '@monorepo/expo/shared/icons';
import { ElementType } from 'react';
import {
  MainModal,
  TMainModalAction,
} from '../../../../../ui-components/MainModal';

export type TContactAction =
  | 'copy'
  | 'openInAppleMaps'
  | 'openInGoogleMaps'
  | 'call'
  | 'sendEmail';

export type TContactActionItem = {
  action: TContactAction;
  label: string;
  onPress: () => void;
};

type TProps = {
  visible: boolean;
  title?: string;
  items: TContactActionItem[];
  onClose: () => void;
};

const ICONS: Record<TContactAction, ElementType> = {
  copy: CopyIcon,
  openInAppleMaps: MapLineIcon,
  openInGoogleMaps: MapLineIcon,
  call: CallOutlinedIcon,
  sendEmail: EmailIcon,
};

export function ContactActionMenu(props: TProps) {
  const { visible, items, onClose } = props;

  const actions: TMainModalAction[] = items.map((item) => ({
    title: item.label,
    Icon: ICONS[item.action],
    onPress: () => {
      item.onPress();
      onClose();
    },
  }));

  return (
    <MainModal
      closeButton
      vertical
      actions={actions}
      isModalVisible={visible}
      closeModal={onClose}
      opacity={0.5}
    />
  );
}
