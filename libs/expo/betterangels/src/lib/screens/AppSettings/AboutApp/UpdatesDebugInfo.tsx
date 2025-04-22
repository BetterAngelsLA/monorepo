import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  Button,
  ExpandableContainer,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import * as Updates from 'expo-updates';
import { ExpoUpdatesManifest } from 'expo/config';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { checkForUpdate } from '../../../ui-components/AppUpdatePrompt';

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

  // TOOD: remove after testing ErrorCrashView via ErrorBoundary in _layout.
  // Using state as click handler errors will not bubble up to ErrorBoundary.
  const [shouldCrash, setShouldCrash] = useState(false);

  useEffect(() => {
    if (shouldCrash) {
      throw new Error('Fake app crash');
    }
  }, [shouldCrash]);

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

      {/* TODO: remove after testing Crash Error screen */}
      <View style={{ marginTop: 24 }}>
        <Button
          variant="negative"
          title="Crash App"
          onPress={() => setShouldCrash(true)}
          accessibilityHint="crashes app."
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pageCard: {
    display: 'flex',
    padding: Spacings.sm,
    borderRadius: Radiuses.xs,
    backgroundColor: Colors.WHITE,
    marginTop: Spacings.md,
    gap: Spacings.xs,
  },
  content: {
    marginTop: Spacings.sm,
    gap: Spacings.sm,
  },
});
