import { useInfiniteScrollQuery } from '@monorepo/apollo';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  InfiniteList,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SHELTERS_PAGE_SIZE } from './constants';
import { ShelterCard } from './ShelterCard';
import { shelterAttributeLabels } from './shelterAttributes';
import {
  SheltersDocument,
  SheltersQuery,
  SheltersQueryVariables,
} from './__generated__/Shelters.generated';

type TProps = {
  onCancel: () => void;
  onPause?: () => void;
  onSubmit: (shelterId: string, notes: string | undefined) => Promise<boolean>;
  // client-needed attributes for match coloring; omit for a neutral list
  desiredAttributes?: string[];
  // Controlled by the shared draft; null means no current selection.
  selectedShelterId: string | null;
  onSelectShelter: (shelterId: string | null) => void;
};

export function ReferralForm({
  onCancel,
  onPause,
  onSubmit,
  desiredAttributes,
  selectedShelterId,
  onSelectShelter,
}: TProps) {
  const [submitted, setSubmitted] = useState(false);

  const {
    items: shelters,
    total,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
  } = useInfiniteScrollQuery<
    SheltersQuery['shelters']['results'][number],
    SheltersQuery,
    SheltersQueryVariables
  >({
    document: SheltersDocument,
    queryFieldName: 'shelters',
    pageSize: SHELTERS_PAGE_SIZE,
  });

  // No status filter here: the `shelters` query is already restricted to
  // approved records server-side (ShelterType.get_queryset -> shelter_list ->
  // filter(status=APPROVED)), and it additionally hides private shelters unless
  // the user holds view_private_shelter. Re-filtering client-side could never
  // remove a row the server sent, and implied a protection the client wasn't
  // providing.
  const selectedShelter = shelters.find((s) => s.id === selectedShelterId);

  async function handleSubmit() {
    if (!selectedShelterId || submitted) return;
    setSubmitted(true);
    const created = await onSubmit(selectedShelterId, undefined);
    // re-enable Submit so a failed referral can be retried
    if (!created) {
      setSubmitted(false);
    }
  }

  return (
    <View style={styles.container} testID="shelter-picker-screen">
      {/* Header — mirrors the intake step: Cancel / Pause / Submit */}
      <View style={styles.header}>
        <Pressable
          testID="picker-cancel-btn"
          style={[styles.headerBtn, styles.headerBtnFlex]}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="cancel referral"
          accessibilityHint="discards this referral"
        >
          <TextRegular size="sm" color={Colors.PRIMARY}>
            Cancel
          </TextRegular>
        </Pressable>
        {onPause && (
          <Pressable
            testID="picker-pause-btn"
            style={[styles.headerBtn, styles.headerBtnFlex]}
            onPress={onPause}
            accessibilityRole="button"
            accessibilityLabel="pause referral"
            accessibilityHint="saves a draft you can resume later"
          >
            <TextRegular size="sm" color={Colors.PRIMARY}>
              Pause
            </TextRegular>
          </Pressable>
        )}
        <Pressable
          testID="submit-referral-btn"
          style={[
            styles.headerBtn,
            styles.headerBtnFlex,
            (!selectedShelterId || submitted) && styles.headerBtnDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!selectedShelterId || submitted}
          accessibilityRole="button"
          accessibilityLabel="submit referral"
          accessibilityHint="submits referral to selected shelter"
        >
          <TextBold size="sm" color={Colors.PRIMARY}>
            Submit
          </TextBold>
        </Pressable>
      </View>

      <View style={styles.body}>
        {/* Shelter picker */}
        <TextBold size="sm" style={styles.sectionLabel}>
          Select a Shelter
        </TextBold>

        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.PRIMARY} />
          </View>
        )}

        {error && shelters.length === 0 && (
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

        {!loading && shelters.length > 0 && (
          <InfiniteList<SheltersQuery['shelters']['results'][number]>
            data={shelters}
            keyExtractor={(shelter) => shelter.id}
            totalItems={total}
            renderResultsHeader={null}
            loadMore={loadMore}
            hasMore={hasMore}
            loadingMore={loadingMore}
            // Cards carry their own bottom margin; keep their spacing only.
            itemGap={0}
            renderItem={(shelter) => {
              const isSelected = shelter.id === selectedShelterId;
              return (
                <Pressable
                  testID="shelter-option"
                  style={[
                    styles.shelterCard,
                    isSelected && styles.shelterCardSelected,
                  ]}
                  onPress={() => {
                    // Radio semantics for picking (tapping any card moves the
                    // selection here), plus tap-again-to-clear — a volunteer who
                    // selects the wrong shelter would otherwise have no way back
                    // to "nothing chosen" without cancelling the referral.
                    const next = isSelected ? null : shelter.id;
                    onSelectShelter(next);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityHint={
                    isSelected
                      ? 'double tap to clear this shelter selection'
                      : 'double tap to select this shelter'
                  }
                >
                  <View style={styles.shelterRow}>
                    {/* testID sits on the radio, not the row: the row also
                        contains the directory link, and a centre-tap would open
                        the browser instead of selecting. */}
                    <View
                      testID="shelter-option-radio"
                      style={styles.shelterRadio}
                    >
                      {isSelected && <View style={styles.shelterRadioInner} />}
                    </View>
                    <View style={styles.shelterInfo}>
                      <ShelterCard
                        id={shelter.id}
                        name={shelter.name}
                        place={shelter.location?.place}
                        attributes={shelterAttributeLabels(shelter)}
                        desiredAttributes={desiredAttributes}
                      />
                    </View>
                  </View>
                </Pressable>
              );
            }}
            ListFooterComponent={
              <>
                {loadingMore && (
                  <View style={styles.centered}>
                    <ActivityIndicator size="small" color={Colors.PRIMARY} />
                  </View>
                )}
                {selectedShelter && (
                  <View style={styles.confirmationBox}>
                    <TextBold size="sm" color={Colors.SUCCESS}>
                      ✓ Selected: {selectedShelter.name}
                    </TextBold>
                  </View>
                )}
              </>
            }
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    backgroundColor: Colors.WHITE,
    paddingHorizontal: Spacings.md,
    paddingVertical: Spacings.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.NEUTRAL_LIGHT,
  },
  headerBtn: {
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
    borderRadius: 8,
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.xxs,
  },
  headerBtnFlex: {
    flex: 1,
    alignItems: 'center',
  },
  headerBtnDisabled: {
    opacity: 0.4,
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
});
