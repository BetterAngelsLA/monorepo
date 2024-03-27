import { Attachments, MoodEnum } from '@monorepo/expo/betterangels';
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
  enum: MoodEnum;
  id?: string;
}

interface IMoodProps {
  expanded: string | undefined | null;
  setExpanded: (e: string | undefined | null) => void;
  noteId: string | undefined;
}

const MOOD_DATA: { [key: string]: Mood[] } = {
  pleasant: [
    {
      Icon: FaceSmilingHandsIcon,
      title: 'Agreeable',
      enum: MoodEnum.Agreeable,
    },
    { Icon: FaceSmileIcon, title: 'Euthymic', enum: MoodEnum.Euthymic },
    { Icon: FaceLaughBeamIcon, title: 'Happy', enum: MoodEnum.Happy },
    { Icon: FaceLaughIcon, title: 'Motivated', enum: MoodEnum.Motivated },
    { Icon: FaceRelievedIcon, title: 'Optimistic', enum: MoodEnum.Optimistic },
    {
      Icon: FaceSunglassesIcon,
      title: 'Personable',
      enum: MoodEnum.Personable,
    },
    { Icon: FaceSmileRelaxedIcon, title: 'Pleasant', enum: MoodEnum.Pleasant },
  ],
  neutral: [
    { Icon: FacePoutingIcon, title: 'Agitated', enum: MoodEnum.Agitated },
    {
      Icon: FaceSpiralEyesIcon,
      title: 'Disorganized Thought',
      enum: MoodEnum.DisorganizedThought,
    },
    {
      Icon: FaceMehBlankIcon,
      title: 'Flat/blunted',
      enum: MoodEnum.FlatBlunted,
    },
    {
      Icon: FaceHandYawnIcon,
      title: 'Indifferent',
      enum: MoodEnum.Indifferent,
    },
    { Icon: FaceFrownIcon, title: 'Restless', enum: MoodEnum.Restless },
  ],
  unpleasant: [
    { Icon: FaceAnxiousSweatIcon, title: 'Anxious', enum: MoodEnum.Anxious },
    {
      Icon: FaceDisappointedIcon,
      title: 'Depressed',
      enum: MoodEnum.Depressed,
    },
    { Icon: FaceMehIcon, title: 'Detached', enum: MoodEnum.Detached },
    { Icon: FaceMeltingIcon, title: 'Disoriented', enum: MoodEnum.Disoriented },
    { Icon: FaceSpiralEyesIcon, title: 'Escalated', enum: MoodEnum.Escalated },
    { Icon: FaceWearyIcon, title: 'Hopeless', enum: MoodEnum.Hopeless },
    { Icon: FaceSwearIcon, title: 'Manic', enum: MoodEnum.Manic },
    { Icon: FaceCloudsIcon, title: 'Suicidal', enum: MoodEnum.Suicidal },
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
            {moods.map(
              (mood: { title: string; id: string; enum: MoodEnum }) => {
                const IconComponent = ICONS[mood.title];
                return (
                  <IconComponent
                    mr="xs"
                    key={mood.title}
                    size="md"
                    color={Colors.PRIMARY_EXTRA_DARK}
                  />
                );
              }
            )}
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
          <MoodSelector noteId={noteId} moodsData={moodsData} />
          <Attachments
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
