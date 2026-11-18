import { RoundUpdateIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  ActionModal,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { Dispatch, SetStateAction } from 'react';
import { StyleSheet, View } from 'react-native';

type TProps = {
  visible?: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
  onAccept: () => void;
  onDismiss: () => void;
  /**
   * Overridable because the action differs per platform: native fetches an OTA
   * update, web reloads the document. "Accept" fits neither well enough to keep
   * for both.
   */
  primaryButtonTitle?: string;
  secondaryButtonTitle?: string;
};

export function AppUpdatePromptModal(props: TProps) {
  const {
    onAccept,
    onDismiss,
    visible,
    setVisible,
    primaryButtonTitle = 'Accept',
    secondaryButtonTitle = 'Cancel',
  } = props;

  return (
    <ActionModal
      body={<ModalBody />}
      primaryButtonTitle={primaryButtonTitle}
      onPrimaryPress={onAccept}
      secondaryButtonTitle={secondaryButtonTitle}
      onSecondaryPress={onDismiss}
      visible={!!visible}
      setVisible={setVisible}
    />
  );
}

function ModalBody() {
  return (
    <View style={styles.modalBody}>
      <View style={styles.updateIconView}>
        <RoundUpdateIcon size={80} color={Colors.PRIMARY} />
      </View>
      <TextBold size="lg">A new version is available.</TextBold>
      <TextRegular size="sm">
        For the best and most reliable functionality, please upgrade to the
        current version.
      </TextRegular>
    </View>
  );
}

const styles = StyleSheet.create({
  modalBody: {
    gap: Spacings.sm,
    marginBottom: Spacings.sm,
  },
  updateIconView: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
