import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  ExpandableContainer,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { checkForUpdate } from '../../../ui-components/AppUpdate';

export function UpdatesDebugInfo() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const { channel, checkAutomatically, isEnabled, isEmbeddedLaunch } = Updates;

  useEffect(() => {
    const fetchUpdate = async () => {
      const { isAvailable } = await checkForUpdate();

      setUpdateAvailable(isAvailable);
    };

    fetchUpdate();
  }, []);

  return (
    <View style={styles.pageCard}>
      <ExpandableContainer
        title="Updates Info"
        stylesTitleText={{ fontWeight: 700 }}
      >
        <View style={styles.content}>
          <TextRegular>
            new Update Available : {String(updateAvailable)}
          </TextRegular>
          <TextBold mt="sm">Updates Data:</TextBold>
          <TextRegular>isEnabled : {String(isEnabled)}</TextRegular>
          <TextRegular>Updates channel : {channel || 'undefined'}</TextRegular>
          <TextRegular>checkAutomatically : {checkAutomatically}</TextRegular>
          <TextRegular>
            isEmbeddedLaunch : {isEmbeddedLaunch || 'undefined'}
          </TextRegular>
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
