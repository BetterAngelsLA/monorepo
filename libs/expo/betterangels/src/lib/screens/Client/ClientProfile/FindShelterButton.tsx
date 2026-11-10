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
  flushAnalytics,
  useAnalytics,
} from '../../../analytics';
import { withShelterHandoff } from '@monorepo/shared/shelter-handoff';
import { shelterHomeUrl } from '../Referrals/shelterDirectory';

/**
 * Opens the shelter site from a client profile, recording the departure and
 * handing the session over in the URL.
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
    // Repeated because TypeScript does not carry the render guard's narrowing
    // into a hoisted function.
    if (!url) return;

    setError(false);

    const identity = getIdentity();
    const target = withShelterHandoff(url, identity);

    capture(AnalyticsEvent.ShelterSearchOpened, {
      source: ShelterSearchSource.ClientProfile,
      handoff: Boolean(identity.sessionId),
      handoff_person: Boolean(identity.distinctId),
    });

    // Opening a browser can suspend the app before the batch timer fires.
    await flushAnalytics();

    try {
      await WebBrowser.openBrowserAsync(target);
    } catch {
      // No landing event will follow this press, so say so rather than leaving
      // a start with no end.
      capture(AnalyticsEvent.ShelterSearchFailed, {
        source: ShelterSearchSource.ClientProfile,
      });
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
  /**
   * Full-bleed on purpose: the profile cards below are `width: '100%'` with no
   * horizontal margin, so any horizontal padding here would make the button
   * narrower than the stack it sits on.
   */
  container: {
    marginBottom: Spacings.sm,
  },
});
