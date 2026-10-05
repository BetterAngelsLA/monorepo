import { Colors } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { DeferredFieldsCard } from './DeferredFieldsCard';
import { Field } from './IntakeField';
import { MemoryIcon, PiiTag } from './IntakeFieldMarkers';
import { ProfileCard, type ProfileCardData } from './ProfileCard';
import { useReferralDraft } from './ReferralDraftProvider';
import { GREEN, RED, styles } from './intakeFormStyles';
import { INTAKE_FIELDS, missingRequiredIntakeFields } from './intakeFields';

const NEEDS_FIELDS = INTAKE_FIELDS.filter((field) => field.section === 'needs');
const ADDITIONAL_FIELDS = INTAKE_FIELDS.filter(
  (field) => field.section === 'additional',
);

type TProps = {
  onCancel: () => void;
  onPause: () => void;
  onContinue: () => void;
  profile?: ProfileCardData | null;
  onEditProfile?: () => void;
};

export function ReferralIntakeForm({
  onCancel,
  onPause,
  onContinue,
  profile,
  onEditProfile,
}: TProps) {
  const { draft, store } = useReferralDraft();
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
    <View style={styles.container} testID="referral-intake-screen">
      <View style={styles.header}>
        <Pressable
          testID="intake-cancel-btn"
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
        <Pressable
          testID="intake-pause-btn"
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
        <Pressable
          testID="intake-next-btn"
          style={[styles.headerBtn, styles.headerBtnFlex]}
          onPress={continueToShelters}
          accessibilityRole="button"
          accessibilityLabel="continue to shelter picker"
          accessibilityHint="proceeds to select a shelter"
        >
          <TextBold size="sm" color={Colors.PRIMARY}>
            Next
          </TextBold>
        </Pressable>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
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

        <ProfileCard profile={profile} onEditProfile={onEditProfile} />

        <TextBold size="sm" style={styles.sectionLabel}>
          Required Information for Referral
        </TextBold>
        {NEEDS_FIELDS.map((f) => (
          <Field
            key={f.key}
            f={f}
            value={draft?.answers[f.key]}
            onChange={(v) => store.setControlValue(f.key, v)}
          />
        ))}

        <DeferredFieldsCard />

        <View style={styles.divider} />

        {ADDITIONAL_FIELDS.map((f) => (
          <Field
            key={f.key}
            f={f}
            value={draft?.answers[f.key]}
            onChange={(v) => store.setControlValue(f.key, v)}
          />
        ))}

        <View style={styles.footerSpace} />
      </ScrollView>
    </View>
  );
}
