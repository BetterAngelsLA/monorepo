import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { useAppState } from '../../hooks';
import { AppUpdatePromptModal } from './AppUpdatePromptModal';
import { canShowPromptAgain } from './canShowPromptAgain';
import { checkForUpdate } from './checkForUpdate';
import { LAST_UPDATE_CHECK_TS_KEY, UPDATE_DISMISSED_TS_KEY } from './constants';

export function AppUpdatePrompt() {
  const [promptModalVisible, setPromptModalVisible] = useState(false);
  const { appBecameActive } = useAppState();

  useEffect(() => {
    const showPrompt = async () => {
      const canShowAgain = await canShowPromptAgain();

      if (!canShowAgain) {
        return;
      }

      const { isAvailable } = await checkForUpdate();

      if (isAvailable) {
        setPromptModalVisible(true);
      }
    };

    console.log('*****************  appBecameActive:', appBecameActive);

    if (!appBecameActive) {
      return;
    }

    showPrompt();
  }, [appBecameActive]);

  async function onAccept() {
    setPromptModalVisible(false);

    try {
      await Updates.fetchUpdateAsync();

      // reset storage data before reload
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
