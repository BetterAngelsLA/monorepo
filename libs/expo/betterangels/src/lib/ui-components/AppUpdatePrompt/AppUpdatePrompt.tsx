import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { useAppState } from '../../hooks';
import { AppUpdatePromptModal } from './AppUpdatePromptModal';
import { canShowPromptAgain } from './canShowPromptAgain';
import { checkForUpdate } from './checkForUpdate';
import { LAST_UPDATE_CHECK_TS_KEY, UPDATE_DISMISSED_TS_KEY } from './constants';

type TProps = {
  forceCanShow?: boolean;
};

export function AppUpdatePrompt(props: TProps) {
  const { forceCanShow } = props;

  const [promptModalVisible, setPromptModalVisible] = useState(false);
  const { appBecameActive } = useAppState();

  useEffect(() => {
    const showPrompt = async () => {
      const canShowAgain = forceCanShow || (await canShowPromptAgain());

      if (!canShowAgain) {
        return;
      }

      const { isAvailable } = await checkForUpdate();

      if (isAvailable) {
        setPromptModalVisible(true);
      }
    };

    if (forceCanShow || appBecameActive) {
      showPrompt();
    }
  }, [appBecameActive, forceCanShow]);

  async function onAccept() {
    setPromptModalVisible(false);

    try {
      await Updates.fetchUpdateAsync();

      // Reseting storage data before reload since it's not recommended
      // to run code after Updates.reloadAsync due to possible errors.
      // Resetting LAST_UPDATE_CHECK_TS_KEY to prevent immediately showing modal again
      // and any possible error infinite loop.
      await Promise.all([
        AsyncStorage.setItem(UPDATE_DISMISSED_TS_KEY, ''),
        AsyncStorage.setItem(LAST_UPDATE_CHECK_TS_KEY, String(Date.now())),
      ]);

      // reload app with update
      await Updates.reloadAsync();
    } catch (e) {
      console.error('Error updating app:', e);
    }
  }

  async function onDismiss() {
    await AsyncStorage.setItem(UPDATE_DISMISSED_TS_KEY, String(Date.now()));
  }

  return (
    <AppUpdatePromptModal
      visible={promptModalVisible}
      setVisible={setPromptModalVisible}
      onAccept={onAccept}
      onDismiss={onDismiss}
    />
  );
}
