import { Colors } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { Pressable, View } from 'react-native';
import { MemoryIcon, PiiTag } from './IntakeFieldMarkers';
import { GREEN, styles } from './intakeFormStyles';
import { referralProfileRows, type ProfileCardData } from './shared/referralProfile';
export type { ProfileCardData } from './shared/referralProfile';

/** Read-only profile fields (name + the profile-backed required fields). */
export function ProfileCard({
  profile,
  onEditProfile,
}: {
  profile?: ProfileCardData | null;
  onEditProfile?: () => void;
}) {
  const rows = referralProfileRows(profile);

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
            {r.value ?? 'Not on file'}
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
