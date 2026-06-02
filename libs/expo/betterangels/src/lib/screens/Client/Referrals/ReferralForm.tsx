import { useQuery } from '@apollo/client/react';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Button,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {
  SheltersDocument,
  SheltersQuery,
} from './__generated__/Shelters.generated';

type TProps = {
  onCancel: () => void;
  onSubmit: (shelterId: string, notes: string | undefined) => void;
};

export function ReferralForm({ onCancel, onSubmit }: TProps) {
  const [selectedShelterId, setSelectedShelterId] = useState<string | null>(
    null
  );
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { data, loading, error } = useQuery<SheltersQuery>(SheltersDocument);

  const shelters = (data?.shelters.results ?? []).filter(
    (s) => s.status === 'APPROVED'
  );
  const selectedShelter = shelters.find((s) => s.id === selectedShelterId);

  async function handleSubmit() {
    if (!selectedShelterId) return;
    setSubmitted(true);
    onSubmit(selectedShelterId, notes.trim() || undefined);
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onCancel} accessibilityRole="button">
          <TextRegular color={Colors.PRIMARY}>Cancel</TextRegular>
        </Pressable>
        <TextBold size="md">Refer to Shelter</TextBold>
        <Button
          variant="primary"
          size="sm"
          title="Submit"
          onPress={handleSubmit}
          disabled={!selectedShelterId || submitted}
          accessibilityLabel="submit referral"
          accessibilityHint="submits referral to selected shelter"
        />
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Shelter picker */}
        <TextBold size="sm" style={styles.sectionLabel}>
          Select a Shelter
        </TextBold>

        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.PRIMARY} />
          </View>
        )}

        {error && (
          <View style={styles.centered}>
            <TextRegular color={Colors.ERROR}>
              Error loading shelters. Please try again.
            </TextRegular>
          </View>
        )}

        {!loading && !error && shelters.length === 0 && (
          <View style={styles.noShelters}>
            <TextBold size="sm" color={Colors.NEUTRAL_DARK}>
              No shelters available
            </TextBold>
            <TextRegular size="sm" color={Colors.NEUTRAL}>
              Please check back later or contact your supervisor.
            </TextRegular>
          </View>
        )}

        {!loading &&
          shelters.map((shelter) => {
            const isSelected = shelter.id === selectedShelterId;
            return (
              <Pressable
                key={shelter.id}
                style={[
                  styles.shelterCard,
                  isSelected && styles.shelterCardSelected,
                ]}
                onPress={() => setSelectedShelterId(shelter.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
              >
                <View style={styles.shelterRow}>
                  <View style={styles.shelterRadio}>
                    {isSelected && <View style={styles.shelterRadioInner} />}
                  </View>
                  <View style={styles.shelterInfo}>
                    <TextBold size="sm">{shelter.name}</TextBold>
                    {shelter.location?.place ? (
                      <TextRegular size="sm" color={Colors.NEUTRAL_DARK}>
                        {shelter.location.place}
                      </TextRegular>
                    ) : null}
                    <Pressable
                      onPress={() =>
                        Linking.openURL(
                          `https://shelterconnect.org/shelters/${shelter.id}`
                        )
                      }
                      accessibilityRole="link"
                    >
                      <TextRegular size="sm" color={Colors.PRIMARY}>
                        View shelter directory →
                      </TextRegular>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            );
          })}

        {/* Confirmation section - shown when shelter is selected */}
        {selectedShelter && (
          <View style={styles.confirmationBox}>
            <TextBold size="sm" color={Colors.SUCCESS}>
              ✓ Selected: {selectedShelter.name}
            </TextBold>
          </View>
        )}

        {/* Notes field */}
        <TextBold size="sm" style={styles.sectionLabel}>
          Notes (optional)
        </TextBold>
        <TextInput
          style={styles.notesInput}
          placeholder="Add any notes about this referral..."
          placeholderTextColor={Colors.NEUTRAL}
          multiline
          numberOfLines={4}
          value={notes}
          onChangeText={setNotes}
          accessibilityLabel="referral notes"
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.WHITE,
    paddingHorizontal: Spacings.md,
    paddingVertical: Spacings.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.NEUTRAL_LIGHT,
  },
  body: {
    flex: 1,
    paddingHorizontal: Spacings.md,
    paddingTop: Spacings.md,
  },
  sectionLabel: {
    marginBottom: Spacings.xs,
    marginTop: Spacings.md,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacings.xl,
  },
  noShelters: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacings.xl,
    gap: Spacings.xs,
  },
  shelterCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 8,
    padding: Spacings.md,
    marginBottom: Spacings.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  shelterCardSelected: {
    borderColor: Colors.PRIMARY,
  },
  shelterRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.sm,
  },
  shelterRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  shelterRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.PRIMARY,
  },
  shelterInfo: {
    flex: 1,
    gap: 2,
  },
  confirmationBox: {
    backgroundColor: Colors.SUCCESS_LIGHT,
    borderRadius: 8,
    padding: Spacings.md,
    marginTop: Spacings.sm,
    marginBottom: Spacings.md,
  },
  notesInput: {
    backgroundColor: Colors.WHITE,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.NEUTRAL_LIGHT,
    padding: Spacings.md,
    fontSize: 14,
    color: Colors.NEUTRAL_DARK,
    textAlignVertical: 'top',
    minHeight: 100,
    marginBottom: Spacings.xl,
  },
});
