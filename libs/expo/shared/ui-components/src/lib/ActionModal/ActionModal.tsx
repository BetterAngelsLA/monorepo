import { Dispatch, SetStateAction } from 'react';
import BasicModal from '../BasicModal';
import Body from './Body';
import Header from './Header';

export interface IActionModalProps {
  title: string;
  subtitle?: string;
  primaryButtonTitle: string;
  secondaryButtonTitle?: string;
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
  onPrimaryPress: () => void;
  onSecondaryPress?: () => void;
}

export function ActionModal(props: IActionModalProps) {
  const {
    visible,
    setVisible,
    title,
    subtitle,
    onPrimaryPress,
    onSecondaryPress,
    secondaryButtonTitle,
    primaryButtonTitle,
  } = props;

  return (
    <BasicModal visible={visible} setVisible={setVisible}>
      <Header title={title} subtitle={subtitle} />
      <Body
        setVisible={setVisible}
        onPrimaryPress={onPrimaryPress}
        onSecondaryPress={onSecondaryPress}
        secondaryButtonTitle={secondaryButtonTitle}
        primaryButtonTitle={primaryButtonTitle}
      />
    </BasicModal>
  );
}
