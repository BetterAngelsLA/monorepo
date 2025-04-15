import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { useAppState } from '../../hooks';
import { AppUpdatePromptModal } from './AppUpdatePromptModal';
import { canShowPromptAgain } from './canShowPromptAgain';
import { UPDATE_DISMISSED_TS_KEY } from './constants';
import { updateAvailable } from './updateAvailable';

export function AppUpdate() {
  const [promptModalVisible, setPromptModalVisible] = useState(false);

  const { appBecameActive } = useAppState();

  useEffect(() => {
    const showPrompt = async () => {
      const canShowAgain = await canShowPromptAgain(UPDATE_DISMISSED_TS_KEY);
      const isAvailable = await updateAvailable();

      if (canShowAgain && isAvailable) {
        setPromptModalVisible(true);
      }
    };

    if (!appBecameActive) {
      return;
    }

    showPrompt();
  }, [appBecameActive]);

  async function onAccept() {
    setPromptModalVisible(false);

    try {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync(); // reload app with update
    } catch (e) {
      console.log('Error updating app:', e);
    }
  }

  async function onDismiss() {
    await Promise.all([
      AsyncStorage.setItem(UPDATE_DISMISSED_TS_KEY, String(Date.now())),
    ]);
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
