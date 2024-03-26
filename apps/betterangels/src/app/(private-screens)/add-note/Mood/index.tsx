import { Attachments, NoteNamespaceEnum } from '@monorepo/expo/betterangels';
import {
  FaceAnxiousSweatIcon,
  FaceCloudsIcon,
  FaceDisappointedIcon,
  FaceFrownIcon,
  FaceHandYawnIcon,
  FaceLaughBeamIcon,
  FaceLaughIcon,
  FaceMehBlankIcon,
  FaceMehIcon,
  FaceMeltingIcon,
  FacePoutingIcon,
  FaceRelievedIcon,
  FaceSmileIcon,
  FaceSmileRelaxedIcon,
  FaceSmilingHandsIcon,
  FaceSpiralEyesIcon,
  FaceSunglassesIcon,
  FaceSwearIcon,
  FaceWearyIcon,
  IIconProps,
  PaperclipIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { BodyText, FieldCard, H5 } from '@monorepo/expo/shared/ui-components';
import { ComponentType, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';
import MoodSelector from './MoodSelector';

interface Mood {
  Icon: ComponentType<IIconProps>;
  title: string;
}

interface IMoodProps {
  expanded: string | undefined | null;
  setExpanded: (e: string | undefined | null) => void;
  noteId: string | undefined;
}

const MOOD_DATA: { [key: string]: Mood[] } = {
  pleasant: [
    { Icon: FaceSmilingHandsIcon, title: 'Agreeable' },
    { Icon: FaceSmileIcon, title: 'Euthymic' },
    { Icon: FaceLaughBeamIcon, title: 'Happy' },
    { Icon: FaceLaughIcon, title: 'Motivated' },
    { Icon: FaceRelievedIcon, title: 'Optimistic' },
    { Icon: FaceSunglassesIcon, title: 'Personable' },
    { Icon: FaceSmileRelaxedIcon, title: 'Pleasant' },
  ],
  neutral: [
    { Icon: FacePoutingIcon, title: 'Agitated' },
    { Icon: FaceSpiralEyesIcon, title: 'Disorganized Thought' },
    { Icon: FaceMehBlankIcon, title: 'Flat/blunted' },
    { Icon: FaceHandYawnIcon, title: 'Indifferent' },
    { Icon: FaceFrownIcon, title: 'Restless' },
  ],
  unpleasant: [
    { Icon: FaceAnxiousSweatIcon, title: 'Anxious' },
    { Icon: FaceDisappointedIcon, title: 'Depressed' },
    { Icon: FaceMehIcon, title: 'Detached' },
    { Icon: FaceMeltingIcon, title: 'Disoriented' },
    { Icon: FaceSpiralEyesIcon, title: 'Escalated' },
    { Icon: FaceWearyIcon, title: 'Hopeless' },
    { Icon: FaceSwearIcon, title: 'Manic' },
    { Icon: FaceCloudsIcon, title: 'Suicidal' },
  ],
};

const TABS: string[] = ['pleasant', 'neutral', 'unpleasant'];

const ICONS: { [key: string]: React.ComponentType<IIconProps> } = {
  Agreeable: FaceSmilingHandsIcon,
  Euthymic: FaceSmileIcon,
  Happy: FaceLaughBeamIcon,
  Motivated: FaceLaughIcon,
  Optimistic: FaceRelievedIcon,
  Personable: FaceSunglassesIcon,
  Pleasant: FaceSmileRelaxedIcon,
  Anxious: FaceAnxiousSweatIcon,
  Depressed: FaceDisappointedIcon,
  Detached: FaceMehIcon,
  Disoriented: FaceMeltingIcon,
  Escalated: FaceSpiralEyesIcon,
  Hopeless: FaceWearyIcon,
  Manic: FaceSwearIcon,
  Suicidal: FaceCloudsIcon,
  Agitated: FacePoutingIcon,
  'Disorganized Thought': FaceSpiralEyesIcon,
  'Flat/blunted': FaceMehBlankIcon,
  Indifferent: FaceHandYawnIcon,
  Restless: FaceFrownIcon,
};

export default function Mood(props: IMoodProps) {
  const { expanded, setExpanded, noteId } = props;
  const [tab, setTab] = useState<string>('pleasant');
  const { watch, setValue } = useFormContext();

  const moodsImages = watch('moodsImages', []);
  const moods = watch('moods') || [];

  const isMood = expanded === 'Mood';
  const isLessThanOneMood = moods.length < 1;
  const isLessThanOneMoodImages = moodsImages.length < 1;
  const isGreaterThanZeroMoodImages = moodsImages?.length > 0;
  const isGreaterThanOneMood = moods.length > 0;
  const isPleasantTab = tab === 'pleasant';
  const isUnpleasantTab = tab === 'unpleasant';
  const isNeutralTab = tab === 'neutral';

  const moodsData = MOOD_DATA[tab] || [];

  const getColor = (tabName: string, light: boolean) => {
    switch (tabName) {
      case 'pleasant':
        return isPleasantTab
          ? light
            ? Colors.SUCCESS_EXTRA_LIGHT
            : Colors.SUCCESS
          : 'transparent';
      case 'unpleasant':
        return isUnpleasantTab
          ? light
            ? Colors.ERROR_EXTRA_LIGHT
            : Colors.ERROR
          : 'transparent';
      case 'neutral':
        return isNeutralTab
          ? light
            ? Colors.WARNING_EXTRA_LIGHT
            : Colors.WARNING
          : 'transparent';
      default:
        return 'transparent';
    }
  };

  return (
    <FieldCard
      mb="xs"
      actionName={
        isMood && isLessThanOneMood && isLessThanOneMoodImages ? (
          ''
        ) : isGreaterThanOneMood || isGreaterThanZeroMoodImages ? (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
            }}
          >
            {moods.map((mood: string) => {
              const IconComponent = ICONS[mood];
              return (
                <IconComponent
                  mr="xs"
                  key={mood}
                  size="md"
                  color={Colors.PRIMARY_EXTRA_DARK}
                />
              );
            })}
            {isGreaterThanZeroMoodImages && (
              <PaperclipIcon size="md" color={Colors.PRIMARY_EXTRA_DARK} />
            )}
          </View>
        ) : (
          <H5 size="sm">Add Mood</H5>
        )
      }
      title="Mood"
      expanded={expanded}
      setExpanded={() => setExpanded(isMood ? null : 'Mood')}
    >
      {isMood && (
        <View style={{ paddingBottom: Spacings.md }}>
          <View style={styles.tabContainer}>
            {TABS.map((tabName) => (
              <Pressable
                accessibilityHint={`${tabName} tab`}
                accessibilityRole="button"
                key={tabName}
                onPress={() => setTab(tabName)}
                style={[
                  styles.tabButton,
                  {
                    backgroundColor: getColor(tabName, true),
                    borderColor: getColor(tabName, false),
                  },
                ]}
              >
                <BodyText size="xs">
                  {tabName.charAt(0).toUpperCase() + tabName.slice(1)}
                </BodyText>
              </Pressable>
            ))}
          </View>
          <MoodSelector moodsData={moodsData} />
          <Attachments
            noteId={noteId}
            namespace={NoteNamespaceEnum.MoodAssessment}
            images={moodsImages}
            setImages={(array) => setValue('moodsImages', array)}
          />
        </View>
      )}
    </FieldCard>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacings.xs,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
  },
});
