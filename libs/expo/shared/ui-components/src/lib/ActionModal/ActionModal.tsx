import { Dispatch, ReactNode, SetStateAction } from 'react';
import BasicModal from '../BasicModal';
import Footer from './Footer';
import Header from './Header';

export interface IActionModalProps {
  title?: string;
  subtitle?: string;
  body?: ReactNode;
  primaryButtonTitle: string;
  secondaryButtonTitle?: string;
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
  onPrimaryPress: () => void;
  onSecondaryPress?: () => void;
  onClose?: () => void;
}

export function ActionModal(props: IActionModalProps) {
  const {
    visible,
    setVisible,
    title,
    subtitle,
    body,
    onPrimaryPress,
    onSecondaryPress,
    secondaryButtonTitle,
    primaryButtonTitle,
    onClose,
  } = props;

  const handleOnClose = () => {
    if (onClose) {
      onClose();
    }
    setVisible(false);
  };

  return (
    <BasicModal visible={visible} onClose={handleOnClose}>
      <Header title={title} subtitle={subtitle} />
      {!!body && body}
      <Footer
        setVisible={setVisible}
        onPrimaryPress={onPrimaryPress}
        onSecondaryPress={onSecondaryPress}
        secondaryButtonTitle={secondaryButtonTitle}
        primaryButtonTitle={primaryButtonTitle}
      />
    </BasicModal>
  );
}
