import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  SingleSelect,
  TextBold,
  TextRegular,
  getUserLocation,
} from '@monorepo/expo/shared/ui-components';
import { useMemo, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { ShelterCard } from './ShelterCard';
import { shelterAttributeLabels } from './shared/shelterAttributes';
import { CancelReferralButton } from './CancelReferralButton';
import { FocusedInfiniteList } from '../../../ui-components/InfiniteList/FocusedInfiniteList';
import { rankShelters, type TCoords } from './shared/shelterAttributes';
import { useReferralShelters } from './useReferralShelters';
import { ChevronLeftIcon } from '@monorepo/expo/shared/icons';

type TOriginMode = 'none' | 'device';

const DISTANCE_ITEMS: { value: TOriginMode; displayValue: string }[] = [
  { value: 'none', displayValue: 'None' },
  { value: 'device', displayValue: 'Near me' },
];

type TProps = {
  // Returns to the intake step. Not a cancel: discarding is offered on the
  // draft card in the referral list, so this slot is better spent letting the
  // volunteer correct an answer. Without it the intake answers become
  // unreachable once Next is tapped — and since those answers now drive the
  // match tags, a mis-tapped need would otherwise mean starting over.
  onBack: () => void;
  onCancel: () => void;
  onPause?: () => void;
  onSubmit: (shelterId: string, notes: string | undefined) => Promise<boolean>;
  // client-needed attributes for match coloring; omit for a neutral list
  desiredAttributes?: string[];
  // seed + persist the shelter choice so it survives Pause / resume.
  // null = the volunteer cleared their choice.
  selectedShelterId: string | null;
  submitting?: boolean;
  onSelectShelter: (shelterId: string | null) => void;
};

export function ReferralForm({
  onBack,
  onCancel,
  onPause,
  onSubmit,
  desiredAttributes,
  selectedShelterId,
  submitting = false,
  onSelectShelter,
}: TProps) {
  const insets = useSafeAreaInsets();
  const [locationMessage, setLocationMessage] = useState('');
  const locationRequest = useRef(0);

  // Which point distance is measured from when breaking ties between shelters
  // with equal match counts. Defaults to 'none': asking for GPS the moment the
  // picker opens would interrupt a volunteer mid-referral, with a guest in
  // front of them, for a preference they may not want.
  const [originMode, setOriginMode] = useState<TOriginMode>('none');
  const [deviceOrigin, setDeviceOrigin] = useState<TCoords | null>(null);
  const [locating, setLocating] = useState(false);

  async function chooseOrigin(mode: TOriginMode) {
    const request = ++locationRequest.current;
    setLocationMessage('');
    if (mode !== 'device') {
      setLocating(false);
      setOriginMode(mode);
      return;
    }
    // Reuse the position we already have rather than re-prompting.
    if (deviceOrigin) {
      setOriginMode('device');
      return;
    }
    setLocating(true);
    const result = await getUserLocation().catch(() => undefined);
    if (request !== locationRequest.current) return;
    setLocating(false);

    const coords = result?.location?.coords;
    if (!coords) {
      // Denied, unavailable, or the OS wants the user in Settings. Stay on
      // 'none' rather than silently selecting a mode that sorts by nothing.
      setLocationMessage(
        result?.requireSettingsUpdate
          ? 'Location is off for this app. Enable it in Settings to sort by distance.'
          : 'Could not get your location. Shelters stay in their current order.',
      );
      return;
    }
    setDeviceOrigin({ latitude: coords.latitude, longitude: coords.longitude });
    setOriginMode('device');
  }

  const origin = originMode === 'device' ? deviceOrigin : null;

  const {
    shelters: allShelters,
    loading,
    error,
    retry,
  } = useReferralShelters();

  // No status filter here: the `shelters` query is already restricted to
  // approved records server-side (ShelterType.get_queryset -> shelter_list ->
  // filter(status=APPROVED)), and it additionally hides private shelters unless
  // the user holds view_private_shelter. Re-filtering client-side could never
  // remove a row the server sent, and implied a protection the client wasn't
  // providing.
  // Best fit first: most matched needs, then nearest, then name. Server order
  // buries a match below the fold — a volunteer shouldn't have to scroll the
  // whole list to learn whether one exists.
  const shelters = useMemo(
    () =>
      rankShelters(allShelters, {
        attributesOf: shelterAttributeLabels,
        desired: desiredAttributes ?? [],
        nameOf: (s) => s.name ?? '',
        coordsOf: (s) => s.location,
        origin,
      }),
    [allShelters, desiredAttributes, origin],
  );
  const selectedShelter = shelters.find((s) => s.id === selectedShelterId);
  const selectionVerified = !loading && !error && !!selectedShelter;
  const canSubmit = selectionVerified && !submitting;
  const selectionMissing =
    !loading && !error && !!selectedShelterId && !selectedShelter;

  async function handleSubmit() {
    if (!canSubmit || !selectedShelter) return;
    await onSubmit(selectedShelter.id, undefined);
  }

  return (
    <View
      style={[styles.container, { paddingBottom: insets.bottom }]}
      testID="shelter-picker-screen"
    >
      {/* Back uses the app's existing chevron. Save remains an explicit action. */}
      <View style={styles.header}>
        <Pressable
          testID="picker-back-btn"
          style={[styles.headerBtn, styles.headerIconBtn]}
          onPress={onBack}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel="back to referral information"
          accessibilityHint="returns to the intake form to change answers"
        >
          <View
            accessible={false}
            importantForAccessibility="no-hide-descendants"
          >
            <ChevronLeftIcon size="sm" color={Colors.PRIMARY} />
          </View>
        </Pressable>
        <CancelReferralButton
          testID="picker-cancel-btn"
          style={[styles.headerBtn, styles.headerBtnFlex]}
          onCancel={onCancel}
          disabled={submitting}
        />
        {onPause && (
          <Pressable
            testID="picker-pause-btn"
            style={[styles.headerBtn, styles.headerBtnFlex]}
            onPress={onPause}
            accessibilityRole="button"
            accessibilityLabel="pause referral"
            accessibilityHint="saves a draft you can resume later"
          >
            <TextRegular size="sm" color={Colors.PRIMARY} numberOfLines={1}>
              Pause
            </TextRegular>
          </Pressable>
        )}
        <Pressable
          testID="submit-referral-btn"
          style={[
            styles.headerBtn,
            styles.headerBtnFlex,
            !canSubmit && styles.headerBtnDisabled,
          ]}
          onPress={() => {
            void handleSubmit();
          }}
          disabled={!canSubmit}
          accessibilityRole="button"
          accessibilityLabel="save referral"
          accessibilityHint="saves a referral record for the selected shelter"
        >
          <TextBold size="sm" color={Colors.PRIMARY} numberOfLines={1}>
            {submitting ? 'Saving…' : 'Save'}
          </TextBold>
        </Pressable>
      </View>
      <TextRegular
        size="xs"
        color={Colors.NEUTRAL_DARK}
        style={{ paddingHorizontal: Spacings.md }}
      >
        Saving records the referral in the app. Share it separately and contact
        the shelter to confirm availability.
      </TextRegular>

      <FocusedInfiniteList
        testID="shelter-choice-group"
        accessibilityRole="radiogroup"
        accessibilityLabel="Shelter choices"
        accessibilityHint="select one shelter using its radio; links open shelter details separately"
        // Keep child radios and directory links separately reachable.
        accessible={false}
        style={styles.body}
        data={!loading && !error ? shelters : []}
        keyExtractor={(shelter) => shelter.id}
        renderResultsHeader={null}
        itemGap={0}
        ListHeaderComponent={
          <View>
            {/* Shelter picker */}
            <TextBold size="lg" style={styles.sectionLabel}>
              Select a Shelter
            </TextBold>

            {selectionMissing && (
              <TextRegular
                testID="shelter-selection-missing"
                accessibilityLiveRegion="polite"
                color={Colors.ERROR}
              >
                Your saved shelter selection is not in the current list. Choose
                another shelter to continue. Your intake answers are saved.
              </TextRegular>
            )}

            {!!locationMessage && (
              <TextRegular accessibilityLiveRegion="polite">
                {locationMessage}
              </TextRegular>
            )}
            <View style={styles.sortRow}>
              <SingleSelect
                label="Distance"
                placeholder="None"
                modalTitle="Distance from"
                maxRadioItems={0}
                selectedValue={originMode}
                items={DISTANCE_ITEMS}
                onChange={(value) =>
                  void chooseOrigin(value === 'device' ? value : 'none')
                }
              />
              <TextRegular size="xs" color={Colors.NEUTRAL}>
                Residence distance is not available yet.
              </TextRegular>
              {/* The first "Near me" can sit for several seconds behind the OS
              permission prompt and the GPS fix. Without this the control looks
              like it ignored the tap, and volunteers tap it again. */}
              {locating && (
                <View style={styles.locatingRow}>
                  <ActivityIndicator size="small" color={Colors.PRIMARY} />
                  <TextRegular size="xs" color={Colors.NEUTRAL_DARK}>
                    Getting your location…
                  </TextRegular>
                </View>
              )}
            </View>

            {loading && (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color={Colors.PRIMARY} />
              </View>
            )}

            {error && (
              <View style={styles.centered}>
                <TextRegular
                  color={Colors.ERROR}
                  accessibilityLiveRegion="polite"
                >
                  Could not check the shelter list. Your draft is saved. Retry
                  before submitting.
                </TextRegular>
                <Pressable
                  testID="retry-shelters-btn"
                  accessibilityRole="button"
                  accessibilityLabel="retry loading shelters"
                  accessibilityHint="refreshes the list and checks your saved shelter selection"
                  disabled={loading || submitting}
                  onPress={() => {
                    // The query's error state presents any retry failure. Do not
                    // discard the saved selection because a request failed.
                    retry();
                  }}
                >
                  <TextBold color={Colors.PRIMARY}>Retry</TextBold>
                </Pressable>
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
          </View>
        }
        renderItem={(shelter) => {
          const isSelected = shelter.id === selectedShelterId;
          return (
            <Pressable
              testID={`shelter-option-row-${shelter.id}`}
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
              disabled={submitting}
              accessible={false}
            >
              <View style={styles.shelterRow}>
                {/* Automation targets the radio, not the whole row: a centre
                    tap on the row can hit its separate directory link. */}
                <Pressable
                  testID={`shelter-option-radio-${shelter.id}`}
                  onPress={() =>
                    onSelectShelter(isSelected ? null : shelter.id)
                  }
                  disabled={submitting}
                  hitSlop={8}
                  accessibilityRole="radio"
                  accessibilityState={{
                    selected: isSelected,
                    checked: isSelected,
                    disabled: submitting,
                  }}
                  accessibilityLabel={shelter.name}
                  accessibilityHint="selects this shelter; tap again to clear"
                  style={styles.shelterRadio}
                >
                  {isSelected && <View style={styles.shelterRadioInner} />}
                </Pressable>
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
          <View>
            {/* Confirmation section - shown when shelter is selected */}
            {selectionVerified && selectedShelter && (
              <View style={styles.confirmationBox}>
                <TextBold size="sm" color={Colors.SUCCESS}>
                  ✓ Selected: {selectedShelter.name}
                </TextBold>
              </View>
            )}
          </View>
        }
      />
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
    flexWrap: 'wrap',
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
    paddingHorizontal: Spacings.xs,
    paddingVertical: Spacings.xxs,
    minHeight: 48,
    justifyContent: 'center',
  },
  headerBtnFlex: {
    flexGrow: 1,
    flexShrink: 0,
    alignItems: 'center',
  },
  headerIconBtn: {
    width: 48,
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
  // The shared Picker clips its value instead of ellipsizing it, so the
  // distance control gets the full width rather than half of it.
  sortRow: {
    paddingHorizontal: Spacings.sm,
    paddingBottom: Spacings.sm,
    gap: Spacings.xs,
  },
  locatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
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
