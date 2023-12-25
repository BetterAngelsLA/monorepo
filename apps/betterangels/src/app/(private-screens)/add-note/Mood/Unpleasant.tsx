import {
  FaceAnxiousSweatIcon,
  FaceCloudsIcon,
  FaceDisappointedIcon,
  FaceMehIcon,
  FaceMeltingIcon,
  FaceSpiralEyesIcon,
  FaceSwearIcon,
  FaceWearyIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { BodyText, Checkbox } from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

const UNPLEASANT_MOOD = [
  { Icon: FaceAnxiousSweatIcon, title: 'Anxious' },
  { Icon: FaceDisappointedIcon, title: 'Depressed' },
  { Icon: FaceMehIcon, title: 'Detached' },
  { Icon: FaceMeltingIcon, title: 'Disoriented' },
  { Icon: FaceSpiralEyesIcon, title: 'Escalated' },
  { Icon: FaceWearyIcon, title: 'Hopeless' },
  { Icon: FaceSwearIcon, title: 'Manic' },
  { Icon: FaceCloudsIcon, title: 'Suicidal' },
];

export default function Unpleasant() {
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
      {UNPLEASANT_MOOD.map((mood, idx) => (
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
