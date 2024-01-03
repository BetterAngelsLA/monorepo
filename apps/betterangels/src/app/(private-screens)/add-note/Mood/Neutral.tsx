import {
  FaceHandYawnIcon,
  FaceMehBlankIcon,
  FacePerseveringIcon,
  FacePoutingIcon,
  FaceSpiralEyesIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { BodyText, Checkbox } from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

const NEUTRAL_MOOD = [
  { Icon: FacePoutingIcon, title: 'Agitated' },
  { Icon: FaceSpiralEyesIcon, title: 'Disorganized Thought' },
  { Icon: FaceMehBlankIcon, title: 'Flat/blunted' },
  { Icon: FaceHandYawnIcon, title: 'Indifferent' },
  { Icon: FacePerseveringIcon, title: 'Restless' },
];

export default function Neutral() {
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
      {NEUTRAL_MOOD.map((mood, idx) => (
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
