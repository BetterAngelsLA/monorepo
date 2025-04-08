import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { Divider } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';
import { useAppVersion } from '../../../hooks';
import { MainContainer } from '../../../ui-components';
import { AppDataCard } from './AppDataCard';

export function AboutApp() {
  const { version, runtimeVersionShort } = useAppVersion();

  return (
    <MainContainer pb={0} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <View style={styles.pageCard}>
        {version && <AppDataCard label="App Version" value={version} />}

        <Divider style={{ marginVertical: Spacings.xxs }} />

        <AppDataCard label="Runtime Version" value={runtimeVersionShort} />
      </View>
    </MainContainer>
  );
}

const styles = StyleSheet.create({
  pageCard: {
    display: 'flex',
    padding: Spacings.sm,
    borderRadius: Radiuses.xs,
    backgroundColor: Colors.WHITE,
  },
});
