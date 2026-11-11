import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  SearchBar,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { ElementType, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ShelterSearchSource } from '../../analytics';
import {
  SHELTER_OPEN_FAILED_MESSAGE,
  SHELTER_UNAVAILABLE_MESSAGE,
} from '../../shelter/messages';
import { useOpenShelterSearch } from '../../shelter/useOpenShelterSearch';
import {
  ClientCard,
  ClientProfileList,
  Header,
  HorizontalContainer,
} from '../../ui-components';

/**
 * The client picker behind "Find Shelter" in the add menu.
 *
 * It asks who before leaving the app only because the button it replaces lives
 * on a client profile: this is the way in from the main screens without hunting
 * for that profile first. The choice is not sent anywhere — the shelter site is
 * public, and nothing about a client may leave this app.
 */
export function FindShelterPicker({ Logo }: { Logo: ElementType }) {
  const [search, setSearch] = useState('');
  const { open, error, opening, canOpen } = useOpenShelterSearch(
    ShelterSearchSource.ClientPicker,
  );

  return (
    <View style={styles.container} testID="find-shelter-screen">
      <Header title="Find shelter" Logo={Logo} />

      <View style={styles.content}>
        <HorizontalContainer>
          <TextBold mb="sm" size="lg">
            Who are you finding shelter for?
          </TextBold>

          <SearchBar
            value={search}
            placeholder="Search by name"
            onChange={(text) => {
              setSearch(text);
            }}
            onClear={() => {
              setSearch('');
            }}
            style={{ marginBottom: Spacings.xs }}
          />

          {error && (
            <TextRegular
              accessibilityLiveRegion="polite"
              color={Colors.ERROR_DARK}
              mb="xs"
            >
              {SHELTER_OPEN_FAILED_MESSAGE}
            </TextRegular>
          )}

          {!canOpen && (
            <TextRegular color={Colors.ERROR_DARK}>
              {SHELTER_UNAVAILABLE_MESSAGE}
            </TextRegular>
          )}
        </HorizontalContainer>

        {canOpen && (
          <ClientProfileList
            filters={{ search }}
            renderItem={(client) => {
              // The name belongs in the label: every row performs the same
              // action, so a generic label would make them indistinguishable to a
              // screen reader (and to the e2e flow that presses one).
              const name = [client.firstName, client.lastName]
                .filter(Boolean)
                .join(' ');

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Find shelter for ${name}`}
                  accessibilityHint="opens the shelter search site in your browser"
                  disabled={opening}
                  onPress={open}
                >
                  <ClientCard type="card" client={client} />
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
  },
  content: {
    flex: 1,
    marginTop: Spacings.sm,
  },
});
