import { Colors } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { Pressable, View } from 'react-native';
import { MemoryIcon, PiiTag } from './IntakeFieldMarkers';
import { GREEN, styles } from './intakeFormStyles';

export type ProfileCardData = {
  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
  displayGender?: string | null;
  dateOfBirth?: string | null;
  veteranStatus?: string | null;
  adaAccommodation?: readonly (string | null)[] | null;
  householdMembers?: readonly unknown[] | null;
};

/** Read-only profile fields (name + the profile-backed required fields). */
export function ProfileCard({
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
