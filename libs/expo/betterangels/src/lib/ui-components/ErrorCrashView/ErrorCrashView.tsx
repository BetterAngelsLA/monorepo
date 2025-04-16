import { Spacings } from '@monorepo/expo/shared/static';
import { Button, TextBold } from '@monorepo/expo/shared/ui-components';
import { ErrorBoundaryProps } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppUpdatePrompt } from '../AppUpdatePrompt';

interface TProps extends ErrorBoundaryProps {}

export default function ErrorCrashView(props: TProps) {
  const { retry } = props;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <TextBold size="lg">Sorry, something went wrong.</TextBold>

        <Button
          style={{
            paddingHorizontal: 60,
          }}
          onPress={retry}
          size="full"
          fontSize="sm"
          accessibilityHint="reload the app"
          variant="primary"
          title="Retry"
        />
      </View>

      <AppUpdatePrompt forceCanShow={true} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    gap: Spacings.lg,
    paddingHorizontal: Spacings.sm,
    alignItems: 'center',
    textAlign: 'center',
  },
});
