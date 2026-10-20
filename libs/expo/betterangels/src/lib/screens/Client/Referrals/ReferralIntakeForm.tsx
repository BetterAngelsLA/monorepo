import { Colors } from '@monorepo/expo/shared/static';
import {
  RNKeyboardAwareScrollView,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { Alert, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CancelReferralButton } from './CancelReferralButton';
import { ChevronLeftIcon } from '@monorepo/expo/shared/icons';
import { DeferredFieldsCard } from './DeferredFieldsCard';
import { Field } from './IntakeField';
import { MemoryIcon, PiiTag } from './IntakeFieldMarkers';
import { ProfileCard, type ProfileCardData } from './ProfileCard';
import { useReferralDraft } from './ReferralDraftProvider';
import { useLocalDraftAction } from './useLocalDraftAction';
import { GREEN, RED, styles } from './intakeFormStyles';
import {
  INTAKE_FIELDS,
  getIntakeField,
  isRequiredIntakeField,
  missingRequiredIntakeFields,
} from '../../../draft/intakeFields';

const NEEDS_FIELDS = INTAKE_FIELDS.filter((field) => field.section === 'needs');
const ADDITIONAL_FIELDS = INTAKE_FIELDS.filter(
  (field) =>
    field.section === 'additional' && field.key !== 'requestedArrivalDate',
);
const ARRIVAL_FIELDS = INTAKE_FIELDS.filter(
  (field) => field.key === 'requestedArrivalDate',
);

type TProps = {
  onCancel: () => void;
  onPause: () => void;
  onContinue: () => void;
  editing?: boolean;
  profile?: ProfileCardData | null;
  onEditProfile?: () => void;
};

export function ReferralIntakeForm({
  onCancel,
  onPause,
  onContinue,
  editing = false,
  profile,
  onEditProfile,
}: TProps) {
  const { draft, store } = useReferralDraft();
  const insets = useSafeAreaInsets();
  const runDraftAction = useLocalDraftAction();
  const continueToShelters = () => {
    const missing = missingRequiredIntakeFields(draft?.answers ?? {});
    if (missing.length) {
      Alert.alert(
        'Complete required information',
        missing.map((field) => field.label).join(', '),
      );
      return;
    }
    onContinue();
  };

  return (
    <View
      style={[styles.container, { paddingBottom: insets.bottom }]}
      testID="referral-intake-screen"
    >
      <View style={styles.header}>
        <CancelReferralButton
          testID="intake-cancel-btn"
          style={[styles.headerBtn, styles.headerBtnFlex]}
          onCancel={onCancel}
          editing={editing}
          disabled={draft?.submission.status === 'pending'}
        />
        <Pressable
          testID="intake-pause-btn"
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
        <Pressable
          testID="intake-next-btn"
          style={[
            styles.headerBtn,
            editing ? styles.headerBtnFlex : styles.headerIconBtn,
          ]}
          onPress={continueToShelters}
          accessibilityRole="button"
          accessibilityLabel={
            editing
              ? 'save referral changes'
              : draft?.source?.kind === 'reuse'
                ? 'confirm review and continue to shelter picker'
                : 'continue to shelter picker'
          }
          accessibilityHint={
            editing
              ? 'saves changes to this referral only'
              : 'proceeds to select a shelter'
          }
        >
          {editing ? (
            <TextBold size="sm" color={Colors.PRIMARY} numberOfLines={1}>
              Save changes
            </TextBold>
          ) : (
            <View
              accessible={false}
              importantForAccessibility="no-hide-descendants"
            >
              <ChevronLeftIcon
                size="sm"
                color={Colors.PRIMARY}
                rotate="180deg"
              />
            </View>
          )}
        </Pressable>
      </View>

      <RNKeyboardAwareScrollView
        testID="referral-intake-fields"
        style={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
        extraKeyboardSpace={24}
      >
        {/* Dev aid: explains how each answer is stored. Hidden in release builds. */}
        {__DEV__ && (
          <View style={styles.legend}>
            <View style={styles.legendRow}>
              <MemoryIcon color={Colors.NEUTRAL} />
              <TextRegular
                size="xs"
                color={Colors.NEUTRAL}
                style={styles.legendText}
              >
                {'Saved to a dedicated field ('}
                <TextRegular size="xs" color={GREEN}>
                  green
                </TextRegular>
                {') or with referral notes ('}
                <TextRegular size="xs" color={RED}>
                  red
                </TextRegular>
                {')'}
              </TextRegular>
            </View>
            <View style={styles.legendRow}>
              <PiiTag />
              <TextRegular
                size="xs"
                color={Colors.NEUTRAL}
                style={styles.legendText}
              >
                {' = personally identifying · '}
                <TextRegular size="xs" color={RED}>
                  red edge
                </TextRegular>
                {' = sensitive (health / DV)'}
              </TextRegular>
            </View>
          </View>
        )}

        {draft?.source?.kind === 'reuse' && (
          <View style={styles.field} testID="referral-reuse-review">
            <TextBold>Review the copied information</TextBold>
            <TextRegular>
              Confirm these answers with the client before continuing. Consent
              and staff notes need new answers.
            </TextRegular>
            {!!draft.source.reviewKeys.length && (
              <TextRegular>
                Review:{' '}
                {draft.source.reviewKeys
                  .map((key) => getIntakeField(key)?.label ?? key)
                  .join(', ')}
              </TextRegular>
            )}
            {!!draft.source.skippedKeys.length && (
              <TextRegular>
                Some older answers could not be copied completely. Review the
                form and fill in anything missing.
              </TextRegular>
            )}
          </View>
        )}
        {editing && (
          <TextRegular>
            Changes apply only to this referral. To choose another shelter,
            create a new referral.
          </TextRegular>
        )}
        <ProfileCard profile={profile} onEditProfile={onEditProfile} />

        <TextBold size="sm" style={styles.sectionLabel}>
          Referral information
        </TextBold>
        <TextRegular size="xs" color={Colors.NEUTRAL_DARK}>
          {INTAKE_FIELDS.some(isRequiredIntakeField)
            ? 'Complete fields marked Required. All other intake fields are optional.'
            : 'All referral intake fields are currently optional.'}
        </TextRegular>
        {[...ARRIVAL_FIELDS, ...NEEDS_FIELDS].map((f) => (
          <Field
            key={f.key}
            f={f}
            value={draft?.answers[f.key]}
            onChange={(v) =>
              runDraftAction(() => store.setControlValue(f.key, v))
            }
          />
        ))}

        {/* Dev aid: the deferred Smartsheet superset, not collected. Hidden in
            release builds. */}
        {__DEV__ && <DeferredFieldsCard />}

        <View style={styles.divider} />

        {ADDITIONAL_FIELDS.map((f) => (
          <Field
            key={f.key}
            f={f}
            value={draft?.answers[f.key]}
            onChange={(v) =>
              runDraftAction(() => store.setControlValue(f.key, v))
            }
          />
        ))}

        <View style={styles.footerSpace} />
      </RNKeyboardAwareScrollView>
    </View>
  );
}
