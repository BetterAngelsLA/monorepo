import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';
import { useReferralDraft } from './ReferralDraftProvider';
import {
  INTAKE_FIELDS,
  missingRequiredIntakeFields,
  type IntakeFieldDefinition,
  type IntakeAnswers,
  type IntakeControlValue,
  type IntakeFieldKey,
} from './intakeFields';
import {
  DEFERRED_FIELD_COUNT,
  DEFERRED_SMARTSHEET_FIELDS,
} from './deferredSmartsheetFields';

/** Intake field behavior and backend mappings are defined in intakeFields.ts. */
const GREEN = '#4E9E6A';
const RED = '#C06A60';

type FormField = IntakeFieldDefinition & { key: IntakeFieldKey };

type ProfileCardData = {
  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
  displayGender?: string | null;
  dateOfBirth?: string | null;
  veteranStatus?: string | null;
  adaAccommodation?: readonly (string | null)[] | null;
  householdMembers?: readonly unknown[] | null;
};

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

/** Read-only profile fields (name + the profile-backed required fields). */
function ProfileCard({
  profile,
  onEditProfile,
}: {
  profile?: ProfileCardData | null;
  onEditProfile?: () => void;
}) {
  const p = profile ?? {};
  const name =
    [p.firstName, p.lastName].filter(Boolean).join(' ') +
    (p.nickname ? ` (${p.nickname})` : '');
  const rows: {
    label: string;
    value: string;
    pii?: boolean;
    sensitive?: boolean;
  }[] = [
    { label: 'Name', value: name || 'Not on file', pii: true },
    { label: 'Gender', value: p.displayGender || 'Not on file', pii: true },
    { label: 'Age (DOB)', value: p.dateOfBirth || 'Not on file', pii: true },
    {
      label: 'Mobility',
      value: p.adaAccommodation?.length
        ? p.adaAccommodation.filter(Boolean).join(', ')
        : 'Not on file',
      sensitive: true,
    },
    {
      label: 'Partners / household',
      value: p.householdMembers?.length
        ? `${p.householdMembers.length} on file`
        : 'None on file',
    },
    { label: 'Veteran', value: p.veteranStatus || 'Not on file' },
  ];

  return (
    <View style={styles.field}>
      <View style={styles.fieldHead}>
        <View style={styles.fieldLabelRow}>
          <TextBold size="sm">From the client&apos;s profile</TextBold>
        </View>
        <MemoryIcon color={GREEN} />
      </View>
      {rows.map((r) => (
        <View
          key={r.label}
          style={[styles.profileRow, r.sensitive && styles.profileRowSensitive]}
        >
          <View style={styles.profileLabelWrap}>
            <TextRegular size="xs" color={Colors.NEUTRAL}>
              {r.label}
            </TextRegular>
            {r.pii && <PiiTag />}
          </View>
          <TextRegular size="sm" color={Colors.NEUTRAL_DARK}>
            {r.value}
          </TextRegular>
        </View>
      ))}

      {onEditProfile && (
        <Pressable
          onPress={onEditProfile}
          style={styles.editLink}
          accessibilityRole="button"
          accessibilityLabel="edit in profile"
          accessibilityHint="opens the client profile to edit, then returns here"
        >
          <TextRegular size="sm" color={Colors.PRIMARY}>
            Edit in profile ›
          </TextRegular>
        </Pressable>
      )}
    </View>
  );
}

/** Database marker: dedicated field or temporary storage with referral notes. */
function MemoryIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Ellipse
        cx={12}
        cy={6}
        rx={7}
        ry={2.7}
        stroke={color}
        strokeWidth={1.4}
      />
      <Path
        d="M5 6v12c0 1.5 3.1 2.7 7 2.7s7-1.2 7-2.7V6"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <Path
        d="M5 12c0 1.5 3.1 2.7 7 2.7s7-1.2 7-2.7"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Small red outline "PII" tag for personally-identifying fields. */
function PiiTag() {
  return (
    <View style={styles.piiTag}>
      <TextRegular size="xs" color={RED}>
        PII
      </TextRegular>
    </View>
  );
}

function Field({
  f,
  value,
  onChange,
}: {
  f: FormField;
  value: IntakeAnswers[IntakeFieldKey];
  onChange: (v: IntakeControlValue) => void;
}) {
  return (
    <View style={[styles.field, f.sensitive && styles.fieldSensitive]}>
      <View style={styles.fieldHead}>
        <View style={styles.fieldLabelRow}>
          <TextBold size="sm">{f.label}</TextBold>
          {f.requirement !== 'optional' && (
            <TextRegular size="xs" color={Colors.ERROR}>
              *
            </TextRegular>
          )}
        </View>
        <View style={styles.fieldMarkers}>
          {f.backend.mode === 'unmapped' ? (
            <TextRegular size="xs" color={Colors.NEUTRAL}>
              Not submitted
            </TextRegular>
          ) : (
            <MemoryIcon color={f.backend.mode === 'direct' ? GREEN : RED} />
          )}
        </View>
      </View>

      {f.help && (
        <TextRegular size="xs" color={Colors.NEUTRAL} style={styles.help}>
          {f.help}
        </TextRegular>
      )}

      <Control f={f} value={value} onChange={onChange} />
    </View>
  );
}

function Control({
  f,
  value,
  onChange,
}: {
  f: FormField;
  value: IntakeAnswers[IntakeFieldKey];
  onChange: (v: IntakeControlValue) => void;
}) {
  if (f.control === 'yesno') {
    return (
      <View style={styles.chips}>
        {['Yes', 'No'].map((opt) => {
          const on = value === opt;
          return (
            <Pressable
              key={opt}
              testID={`${f.key}-${opt.toLowerCase()}-btn`}
              onPress={() => onChange(opt)}
              style={[styles.chip, on && styles.chipOn]}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
            >
              <TextRegular
                size="xs"
                color={on ? Colors.WHITE : Colors.NEUTRAL_DARK}
              >
                {opt}
              </TextRegular>
            </Pressable>
          );
        })}
      </View>
    );
  }

  if (f.control === 'multiselect') {
    // Same chip vocabulary as yes/no, but toggling and multi-valued: the shelter
    // stores these as lists, so the client side has to be able to say "cats and
    // a service animal" rather than just "pets: yes".
    const selected: readonly string[] = Array.isArray(value) ? value : [];
    return (
      <View style={styles.chips}>
        {f.options.map((opt) => {
          const on = selected.includes(opt.value);
          return (
            <Pressable
              key={opt.value}
              testID={`${f.key}-${opt.value}-btn`}
              onPress={() =>
                onChange(
                  on
                    ? selected.filter((v) => v !== opt.value)
                    : [...selected, opt.value],
                )
              }
              style={[styles.chip, on && styles.chipOn]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={opt.label}
              accessibilityHint={`toggles ${opt.label} for ${f.label}`}
            >
              <TextRegular
                size="xs"
                color={on ? Colors.WHITE : Colors.NEUTRAL_DARK}
              >
                {opt.label}
              </TextRegular>
            </Pressable>
          );
        })}
      </View>
    );
  }

  if (f.control === 'checkbox') {
    const checked = value === true;
    return (
      <Pressable
        style={styles.checkboxRow}
        onPress={() => onChange(!checked)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
      >
        <View style={[styles.checkbox, checked && styles.checkboxOn]}>
          {checked && (
            <TextRegular size="xs" color={Colors.WHITE}>
              ✓
            </TextRegular>
          )}
        </View>
        <TextRegular size="xs" color={Colors.NEUTRAL_DARK}>
          {f.checkboxLabel}
        </TextRegular>
      </Pressable>
    );
  }

  // text | textarea
  return (
    <TextInput
      testID={`intake-${f.key}-input`}
      style={[styles.input, f.control === 'textarea' && styles.textarea]}
      multiline={f.control === 'textarea'}
      placeholder="Enter…"
      placeholderTextColor={Colors.NEUTRAL}
      value={typeof value === 'string' ? value : ''}
      onChangeText={onChange}
      accessibilityLabel={f.label}
      accessibilityHint={f.help ?? `enter ${f.label}`}
    />
  );
}

/**
 * Reference-only: the deferred Smartsheet superset, collapsed. Not collected and
 * not wired to anything — it exists so the team/testers can see how much of the
 * Phase-1 intake this form intentionally leaves out (GAP-02 / GAP-13).
 */
function DeferredFieldsCard() {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.deferredCard}>
      <Pressable
        style={styles.deferredHead}
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel="other Smartsheet fields, not collected"
        accessibilityHint="expands the list of deferred Smartsheet fields"
        accessibilityState={{ expanded: open }}
      >
        <View style={styles.deferredTitleWrap}>
          <TextBold size="sm" color={Colors.NEUTRAL_DARK}>
            Other Smartsheet fields
          </TextBold>
          <TextRegular size="xs" color={Colors.NEUTRAL}>
            {`${DEFERRED_FIELD_COUNT} fields · not collected`}
          </TextRegular>
        </View>
        <TextRegular size="sm" color={Colors.NEUTRAL}>
          {open ? '▾' : '▸'}
        </TextRegular>
      </Pressable>

      {open && (
        <View style={styles.deferredBody}>
          <TextRegular size="xs" color={Colors.NEUTRAL} style={styles.help}>
            Reference only — the rest of the Phase-1 Smartsheet intake, deferred
            and unratified (GAP-02 / GAP-13). The required section above is a
            small slice of this; a few items (Pets, DV, accommodations) appear
            there in simplified form.
          </TextRegular>
          {DEFERRED_SMARTSHEET_FIELDS.map((group) => (
            <View key={group.section} style={styles.deferredGroup}>
              <TextBold size="xs" color={Colors.NEUTRAL_DARK}>
                {group.section}
              </TextBold>
              <TextRegular
                size="xs"
                color={Colors.NEUTRAL}
                style={styles.deferredList}
              >
                {group.fields.join('  ·  ')}
              </TextRegular>
            </View>
          ))}
        </View>
      )}
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
  body: {
    flex: 1,
    paddingHorizontal: Spacings.md,
    paddingTop: Spacings.md,
  },
  legend: {
    gap: Spacings.xxs,
    marginBottom: Spacings.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xxs,
  },
  legendText: {
    fontStyle: 'italic',
    flexShrink: 1,
  },
  sectionLabel: {
    marginBottom: Spacings.xs,
    marginTop: Spacings.sm,
  },
  field: {
    backgroundColor: Colors.WHITE,
    borderRadius: 8,
    padding: Spacings.md,
    marginBottom: Spacings.sm,
  },
  fieldSensitive: {
    borderLeftWidth: 3,
    borderLeftColor: RED,
  },
  fieldHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacings.sm,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xxs,
    flexShrink: 1,
  },
  fieldMarkers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xxs,
  },
  piiTag: {
    borderWidth: 1,
    borderColor: RED,
    borderRadius: 3,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  help: {
    marginTop: 2,
    marginBottom: Spacings.xs,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacings.sm,
    paddingVertical: Spacings.xxs,
    borderTopWidth: 1,
    borderTopColor: Colors.NEUTRAL_EXTRA_LIGHT,
  },
  profileRowSensitive: {
    borderLeftWidth: 3,
    borderLeftColor: RED,
    paddingLeft: Spacings.xs,
  },
  profileLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xxs,
    flexShrink: 1,
  },
  editLink: {
    alignSelf: 'flex-start',
    marginTop: Spacings.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.xs,
    marginTop: Spacings.xs,
  },
  chip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.NEUTRAL_LIGHT,
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.xs,
    backgroundColor: Colors.WHITE,
  },
  chipOn: {
    backgroundColor: Colors.PRIMARY,
    borderColor: Colors.PRIMARY,
  },
  input: {
    backgroundColor: Colors.WHITE,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.NEUTRAL_LIGHT,
    paddingHorizontal: Spacings.md,
    paddingVertical: Spacings.sm,
    marginTop: Spacings.xs,
    fontSize: 14,
    color: Colors.NEUTRAL_DARK,
  },
  textarea: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    marginTop: Spacings.xs,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.NEUTRAL_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.WHITE,
  },
  checkboxOn: {
    backgroundColor: Colors.PRIMARY,
    borderColor: Colors.PRIMARY,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.NEUTRAL_LIGHT,
    marginVertical: Spacings.md,
  },
  footerSpace: {
    height: Spacings.xl,
  },
  deferredCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.NEUTRAL_LIGHT,
    borderStyle: 'dashed',
    padding: Spacings.md,
    marginBottom: Spacings.sm,
  },
  deferredHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacings.sm,
  },
  deferredTitleWrap: {
    flexShrink: 1,
  },
  deferredBody: {
    marginTop: Spacings.xs,
  },
  deferredGroup: {
    marginTop: Spacings.xs,
    gap: 2,
  },
  deferredList: {
    lineHeight: 18,
  },
});
