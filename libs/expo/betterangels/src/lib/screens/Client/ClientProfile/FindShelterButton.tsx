import { HouseLineIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { Button, TextRegular } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';
import { ShelterSearchSource } from '../../../analytics';
import { SHELTER_OPEN_FAILED_MESSAGE } from '../../../shelter/messages';
import { useOpenShelterSearch } from '../../../shelter/useOpenShelterSearch';

/**
 * Opens the shelter site from a client profile, recording the departure and
 * handing the session over in the URL.
 *
 * Rendered as a pill in the client header rather than a full-width button in
 * the profile body: it belongs with the client-level actions, and a full row
 * above the cards pushed the client's own information down the screen.
 */
export function FindShelterButton() {
  const { open, error, opening, canOpen } = useOpenShelterSearch(
    ShelterSearchSource.ClientProfile,
  );

  if (!canOpen) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Button
        testID="find-shelter-profile-btn"
        title="Find shelter"
        variant="secondary"
        size="auto"
        height="md"
        fontSize="sm"
        borderRadius={50}
        accessibilityLabel="Find shelter"
        accessibilityHint="opens the shelter search site in your browser"
        loading={opening}
        disabled={opening}
        icon={<HouseLineIcon size="sm" color={Colors.PRIMARY} />}
        onPress={open}
      />
      {error && (
        <View style={styles.error}>
          <TextRegular
            accessibilityLiveRegion="polite"
            color={Colors.ERROR_DARK}
            mt="xxs"
            textAlign="right"
          >
            {SHELTER_OPEN_FAILED_MESSAGE}
          </TextRegular>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  /** Right-aligned: it sits at the end of the header's name row. */
  container: {
    alignItems: 'flex-end',
  },
  /**
   * The header row has room for a pill, not a sentence — so the failure wraps
   * beneath the control that caused it instead of stretching the row.
   */
  error: {
    maxWidth: 200,
  },
});
