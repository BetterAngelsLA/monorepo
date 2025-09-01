import { Spacings } from '@monorepo/expo/shared/static';
import { Button, TextBold } from '@monorepo/expo/shared/ui-components';
import { ErrorBoundaryProps } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppUpdatePrompt } from '../AppUpdatePrompt';

export default function ErrorCrashView(props: ErrorBoundaryProps) {
  const { retry } = props;

  const [hasRetried, setHasRetried] = useState(false);

  const handleRetry = () => {
    if (!hasRetried) {
      setHasRetried(true);

      retry();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <TextBold size="lg">Sorry, something went wrong.</TextBold>

        <Button
          style={styles.retryButton}
          onPress={handleRetry}
          disabled={hasRetried}
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
  retryButton: {
    paddingHorizontal: 60,
  },
});
