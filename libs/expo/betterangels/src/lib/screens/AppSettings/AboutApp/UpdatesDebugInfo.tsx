import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  ExpandableContainer,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import * as Updates from 'expo-updates';
import { ExpoUpdatesManifest } from 'expo/config';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { checkForUpdate } from '../../../ui-components/AppUpdatePrompt';
import {
  LAST_UPDATE_CHECK_TS_KEY,
  UPDATE_DISMISSED_TS_KEY,
} from '../../../ui-components/AppUpdatePrompt/constants';

type TUpdate = {
  isAvailable?: boolean;
  id?: string;
  runtimeVersion?: string;
};

export function UpdatesDebugInfo() {
  const [update, setUpdate] = useState<TUpdate>({});

  const { channel, checkAutomatically, isEnabled, isEmbeddedLaunch } = Updates;

  useEffect(() => {
    const fetchUpdate = async () => {
      const { isAvailable, manifest = {} } = await checkForUpdate();

      const { id, runtimeVersion } = manifest as ExpoUpdatesManifest;

      setUpdate({
        isAvailable,
        id,
        runtimeVersion,
      });
    };

    fetchUpdate();
  }, []);

  const [lastDismissedTs, setLastDismissedTs] = useState('');
  const [lastUpdatedTs, setLastUpdatedTs] = useState('');

  useEffect(() => {
    async function updateFromStorage() {
      const lastUpdated = await AsyncStorage.getItem(LAST_UPDATE_CHECK_TS_KEY);
      const lastDismissed = await AsyncStorage.getItem(UPDATE_DISMISSED_TS_KEY);

      setLastUpdatedTs(lastUpdated || '');
      setLastDismissedTs(lastDismissed || '');
    }

    updateFromStorage();
  }, []);

  return (
    <View style={styles.pageCard}>
      <ExpandableContainer
        title="Updates Info"
        stylesTitleText={{ fontWeight: 700 }}
      >
        <View style={styles.content}>
          <TextRegular>
            Update available : {String(update.isAvailable)}
          </TextRegular>

          <TextRegular>
            Last dismissed : {formatTs(lastDismissedTs)}
          </TextRegular>

          <TextRegular>Last updated : {formatTs(lastUpdatedTs)}</TextRegular>

          <TextBold mt="sm">Update Data:</TextBold>

          <TextRegular>isEnabled : {String(isEnabled)}</TextRegular>
          <TextRegular>Updates channel : {channel || 'undefined'}</TextRegular>
          <TextRegular>
            checkAutomatically : {checkAutomatically || 'undefined'}
          </TextRegular>
          <TextRegular>
            isEmbeddedLaunch : {String(isEmbeddedLaunch)}
          </TextRegular>
          <TextRegular>Id : {String(update.id) || 'undefined'}</TextRegular>
          <TextRegular>
            Runtime version : {String(update.runtimeVersion) || 'undefined'}
          </TextRegular>
        </View>
      </ExpandableContainer>
    </View>
  );
}

function formatTs(ts?: string) {
  try {
    return format(new Date(parseInt(ts || '')), 'MM/dd/yyyy hh:mm:ss');
  } catch (e) {
    return 'n/a';
  }
}

const styles = StyleSheet.create({
  pageCard: {
    display: 'flex',
    padding: Spacings.sm,
    paddingBottom: Spacings.xl,
    borderRadius: Radiuses.xs,
    backgroundColor: Colors.WHITE,
    marginTop: Spacings.md,
    marginBottom: Spacings.xl,
    gap: Spacings.xs,
  },
  content: {
    marginTop: Spacings.sm,
    gap: Spacings.sm,
  },
});
