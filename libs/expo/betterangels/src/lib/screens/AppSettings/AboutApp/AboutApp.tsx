import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { Button, Divider } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';
import { handleSessionExpired } from '../../../auth';
import { useAppVersion } from '../../../hooks';
import useSnackbar from '../../../hooks/snackbar/useSnackbar';
import useUser from '../../../hooks/user/useUser';
import { MainScrollContainer } from '../../../ui-components';
import { AppDataCard } from './AppDataCard';

export function AboutApp() {
  const { version, runtimeVersionShort, otaUpdateIdShort } = useAppVersion();
  const { showSnackbar } = useSnackbar();
  const { setUser } = useUser();

  const testSessionExpired = () => {
    handleSessionExpired(showSnackbar, setUser);
  };

  return (
    <MainScrollContainer pb={0} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <View style={styles.pageCard}>
        {version && <AppDataCard label="App Version" value={version} />}

        <Divider style={{ marginVertical: Spacings.xxs }} />

        <AppDataCard label="Runtime Version" value={runtimeVersionShort} />

        <Divider style={{ marginVertical: Spacings.xxs }} />

        <AppDataCard label="OTA Update" value={otaUpdateIdShort} />
      </View>

      <View style={[styles.pageCard, { marginTop: Spacings.md }]}>
        <Button
          title="Test Session Expired (Dev)"
          variant="secondary"
          onPress={testSessionExpired}
          accessibilityHint="Simulates a session timeout/401 error for testing"
          size="full"
        />
      </View>
    </MainScrollContainer>
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
