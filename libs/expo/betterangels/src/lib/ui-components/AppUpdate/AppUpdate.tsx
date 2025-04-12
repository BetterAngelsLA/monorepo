import {
  KeyboardAwareScrollView,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useAppState, useFeatureFlagActive } from '../../hooks';
import { FeatureFlags } from '../../providers/featureControls/constants';

const isLocalEnv = process.env.NODE_ENV === 'development';

export function AppUpdate() {
  const updatesChannel = Updates.channel;

  const { currentlyRunning, isUpdateAvailable, isUpdatePending } =
    Updates.useUpdates();

  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [becameActive, setBecameActive] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<
    Updates.UpdateCheckResult | undefined
  >(undefined);

  const { movedToForeground } = useAppState();

  const featureFlagActive = useFeatureFlagActive(
    FeatureFlags.APP_UPDATE_PROMPT_FF
  );

  useEffect(() => {
    setBecameActive(movedToForeground);

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

      // LOG  Error checking updates:
      //   [Error: Updates.checkForUpdateAsync() is not supported in development builds.]

      setUpdateStatus(newUpdateStatus);
    } catch (e) {
      alert(e);
      console.log(e);
    }
  };

  // await Promise.all([AsyncStorage.setItem('currentEnvironment', env)]);
  // const storedEnv = await AsyncStorage.getItem('currentEnvironment');

  return (
    <View
      style={{
        flex: 1,
        marginTop: 42,
        padding: 16,
        gap: 16,
        borderWidth: 1,
        borderColor: 'purple',
        minHeight: 300,
      }}
    >
      <KeyboardAwareScrollView>
        <TextRegular>isLocalEnv: {String(isLocalEnv)}</TextRegular>
        <TextRegular>
          featureFlagActive: {String(featureFlagActive)}
        </TextRegular>
        <TextRegular>updatesChannel: {updatesChannel}</TextRegular>
        <TextRegular>__DEV__ : {__DEV__}</TextRegular>
        <TextRegular>movedToForeground : {String(becameActive)}</TextRegular>
        <TextRegular>updateStatus</TextRegular>
        <TextRegular>{JSON.stringify(updateStatus)}</TextRegular>
        <TextRegular>
          my updateAvailable : {String(updateAvailable)}
        </TextRegular>
        <TextRegular>
          currentlyRunning : {JSON.stringify(currentlyRunning, null, 2)}
        </TextRegular>
        <TextRegular>
          isUpdateAvailable : {String(isUpdateAvailable)}
        </TextRegular>
        <TextRegular>isUpdatePending : {String(isUpdatePending)}</TextRegular>
        <TextRegular>--- Updates constants ---</TextRegular>
        <TextRegular>
          Updates.isEnabled : {String(Updates.isEnabled)}
        </TextRegular>
        <TextRegular>Updates.channel : {Updates.channel}</TextRegular>
        <TextRegular>
          Updates.checkAutomatically : {Updates.checkAutomatically}
        </TextRegular>
        <TextRegular>
          Updates.isEmbeddedLaunch : {Updates.isEmbeddedLaunch}
        </TextRegular>
      </KeyboardAwareScrollView>
    </View>
  );
}
