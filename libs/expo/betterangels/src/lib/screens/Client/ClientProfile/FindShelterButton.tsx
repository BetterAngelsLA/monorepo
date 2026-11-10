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
      handoff: Boolean(identity.sessionId),
      handoff_person: Boolean(identity.distinctId),
    });

    // Opening a browser can suspend this app before the client's batch timer
    // fires; without this the event that starts the funnel is the one that
    // gets lost. Bounded, so a slow network cannot stall the tap.
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
