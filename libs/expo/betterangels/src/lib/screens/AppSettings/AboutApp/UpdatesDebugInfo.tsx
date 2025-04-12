import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  ExpandableContainer,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

const isLocalEnv = process.env.NODE_ENV === 'development';

export function UpdatesDebugInfo() {
  const { channel, checkAutomatically, isEnabled, isEmbeddedLaunch } = Updates;

  const [newUpdateAvailable, setUpdateAvailable] = useState<boolean>(false);

  const checkForUpdates = async () => {
    if (isLocalEnv) {
      return;
    }

    try {
      const newUpdateStatus: Updates.UpdateCheckResult =
        await Updates.checkForUpdateAsync();

      setUpdateAvailable(newUpdateStatus.isAvailable);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    checkForUpdates();
  }, []);

  return (
    <View style={styles.pageCard}>
      <ExpandableContainer
        title="Updates Info"
        stylesTitleText={{ fontWeight: 700 }}
      >
        <View style={styles.content}>
          <TextRegular>isLocalEnv: {String(isLocalEnv)}</TextRegular>
          <TextRegular>
            newUpdateAvailable : {String(newUpdateAvailable)}
          </TextRegular>
          <TextBold mt="sm">Updates Data:</TextBold>
          <TextRegular>isEnabled : {String(isEnabled)}</TextRegular>
          <TextRegular>Updateschannel : {channel}</TextRegular>
          <TextRegular>checkAutomatically : {checkAutomatically}</TextRegular>
          <TextRegular>isEmbeddedLaunch : {isEmbeddedLaunch}</TextRegular>
        </View>
      </ExpandableContainer>
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
