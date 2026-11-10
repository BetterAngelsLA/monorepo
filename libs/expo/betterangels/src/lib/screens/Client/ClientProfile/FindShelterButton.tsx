import { useApiConfig } from '@monorepo/ba-platform';
import { ExternalLinkOutlinedIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Button, TextRegular } from '@monorepo/expo/shared/ui-components';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AnalyticsEvent,
  ShelterSearchSource,
  useAnalytics,
} from '../../../analytics';
import { withShelterHandoff } from '../../../analytics/shelterHandoff';
import { shelterHomeUrl } from '../Referrals/shelterDirectory';

/**
 * Opens the shelter site from a client profile.
 *
 * The tap is captured here rather than in a generic link component because the
 * event and the URL have to be built from the same identity: the event records
 * that the worker left, and the URL fragment is what lets shelter-web record
 * that they arrived as the same session.
 */
export function FindShelterButton() {
  const { apiUrl } = useApiConfig();
  const { capture, getIdentity } = useAnalytics();
  const [error, setError] = useState(false);

  const url = shelterHomeUrl(
    apiUrl,
    process.env['EXPO_PUBLIC_SHELTER_WEB_URL'],
  );

  if (!url) {
    return null;
  }

  async function openShelterSearch() {
    // The render guard below already returned for this case; repeated because
    // TypeScript does not carry a narrowing into a hoisted function.
    if (!url) return;

    setError(false);

    const identity = getIdentity();
    const target = withShelterHandoff(url, identity);

    capture(AnalyticsEvent.ShelterSearchOpened, {
      source: ShelterSearchSource.ClientProfile,
      handoff: Boolean(identity.distinctId && identity.sessionId),
    });

    try {
      await WebBrowser.openBrowserAsync(target);
    } catch {
      setError(true);
    }
  }

  return (
    <View style={styles.container}>
      <Button
        title="Find Shelter"
        variant="secondary"
        size="full"
        accessibilityHint="opens the shelter search site in your browser"
        icon={<ExternalLinkOutlinedIcon size="sm" color={Colors.PRIMARY} />}
        onPress={openShelterSearch}
      />
      {error && (
        <TextRegular
          accessibilityLiveRegion="polite"
          color={Colors.ERROR_DARK}
          mt="xs"
          textAlign="center"
        >
          Could not open the shelter search. Please try again.
        </TextRegular>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacings.sm,
    marginBottom: Spacings.xs,
  },
});
