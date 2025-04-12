import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { useAppState } from '../../hooks';

const isLocalEnv = process.env.NODE_ENV === 'development';

export function AppUpdate() {
  // const updatesChannel = Updates.channel;
  // const { currentlyRunning, isUpdateAvailable, isUpdatePending } =
  //   Updates.useUpdates();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  // const [becameActive, setBecameActive] = useState(false);
  // const [updateStatus, setUpdateStatus] = useState<
  //   Updates.UpdateCheckResult | undefined
  // >(undefined);

  const { movedToForeground } = useAppState();

  // const featureFlagActive = useFeatureFlagActive(
  //   FeatureFlags.APP_UPDATE_PROMPT_FF
  // );

  useEffect(() => {
    if (movedToForeground) {
      checkForUpdates();
    }
  }, [movedToForeground]);

  const checkForUpdates = async () => {
    if (isLocalEnv) {
      return;
    }

    // type UpdateCheckResult =
    //     Updates.UpdateCheckResultRollBack |
    //     Updates.UpdateCheckResultAvailable |
    //     Updates.UpdateCheckResultNotAvailable

    try {
      const newUpdateStatus: Updates.UpdateCheckResult =
        await Updates.checkForUpdateAsync();

      if (newUpdateStatus.isAvailable) {
        setUpdateAvailable(true);
      }

      console.log('*****************  updateAvailable:', updateAvailable);

      // LOG  Error checking updates:
      //   [Error: Updates.checkForUpdateAsync() is not supported in development builds.]
    } catch (e) {
      alert(e);
      console.log(e);
    }
  };

  // await Promise.all([AsyncStorage.setItem('currentEnvironment', env)]);
  // const storedEnv = await AsyncStorage.getItem('currentEnvironment');

  return null;
}
