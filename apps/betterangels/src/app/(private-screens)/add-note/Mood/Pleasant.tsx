import {
  FaceLaughBeamIcon,
  FaceLaughIcon,
  FaceRelievedIcon,
  FaceSmileIcon,
  FaceSmileRelaxedIcon,
  FaceSmilingHandsIcon,
  FaceSunglassesIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { BodyText, Checkbox } from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

const PLEASANT_MOOD = [
  { Icon: FaceSmilingHandsIcon, title: 'Agreeable' },
  { Icon: FaceSmileIcon, title: 'Euthymic' },
  { Icon: FaceLaughBeamIcon, title: 'Happy' },
  { Icon: FaceLaughIcon, title: 'Motivated' },
  { Icon: FaceRelievedIcon, title: 'Optimistic' },
  { Icon: FaceSunglassesIcon, title: 'Personable' },
  { Icon: FaceSmileRelaxedIcon, title: 'Pleasant' },
];

export default function Pleasant() {
  const { setValue, watch } = useFormContext();

  const moods = watch('moods') || [];

  const toggleMood = (mood: string) => {
    const newMoods = moods.includes(mood)
      ? moods.filter((m: string) => m !== mood)
      : [...moods, mood];
    setValue('moods', newMoods);
  };

  return (
    <View style={{ paddingBottom: Spacings.md }}>
      {PLEASANT_MOOD.map((mood, idx) => (
        <Checkbox
          isChecked={moods.includes(mood.title)}
          mt={idx !== 0 ? 'xs' : undefined}
          key={mood.title}
          hasBorder
          onCheck={() => toggleMood(mood.title)}
          accessibilityHint={mood.title}
          label={
            <View style={styles.labelContainer}>
              <mood.Icon color={Colors.PRIMARY_EXTRA_DARK} size="sm" />
              <BodyText ml="xs">{mood.title}</BodyText>
            </View>
          }
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
