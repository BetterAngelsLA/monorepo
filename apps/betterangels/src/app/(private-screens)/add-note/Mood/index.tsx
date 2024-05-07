import {
  Attachments,
  MoodEnum,
  NoteNamespaceEnum,
} from '@monorepo/expo/betterangels';
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
import {
  FieldCard,
  TextMedium,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { ComponentType, RefObject, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import MoodSelector from './MoodSelector';

interface Mood {
  Icon: ComponentType<IIconProps>;
  title: string;
  enum: MoodEnum;
  id?: string;
  tab: 'pleasant' | 'neutral' | 'unpleasant';
}

interface IMoodProps {
  expanded: string | undefined | null;
  setExpanded: (expanded: string | undefined | null) => void;
  noteId: string | undefined;
  scrollRef: RefObject<ScrollView>;
}

const MOOD_DATA: Mood[] = [
  {
    Icon: FaceSmilingHandsIcon,
    title: 'Agreeable',
    enum: MoodEnum.Agreeable,
    tab: 'pleasant',
  },
  {
    Icon: FaceSmileIcon,
    title: 'Euthymic',
    enum: MoodEnum.Euthymic,
    tab: 'pleasant',
  },
  {
    Icon: FaceLaughBeamIcon,
    title: 'Happy',
    tab: 'pleasant',
    enum: MoodEnum.Happy,
  },
  {
    Icon: FaceLaughIcon,
    title: 'Motivated',
    tab: 'pleasant',
    enum: MoodEnum.Motivated,
  },
  {
    Icon: FaceRelievedIcon,
    title: 'Optimistic',
    tab: 'pleasant',
    enum: MoodEnum.Optimistic,
  },
  {
    Icon: FaceSunglassesIcon,
    title: 'Personable',
    enum: MoodEnum.Personable,
    tab: 'pleasant',
  },
  {
    Icon: FaceSmileRelaxedIcon,
    title: 'Pleasant',
    tab: 'pleasant',
    enum: MoodEnum.Pleasant,
  },
  {
    Icon: FacePoutingIcon,
    title: 'Agitated',
    tab: 'neutral',
    enum: MoodEnum.Agitated,
  },
  {
    Icon: FaceSpiralEyesIcon,
    title: 'Disorganized Thought',
    enum: MoodEnum.DisorganizedThought,
    tab: 'neutral',
  },
  {
    Icon: FaceMehBlankIcon,
    title: 'Flat/blunted',
    enum: MoodEnum.FlatBlunted,
    tab: 'neutral',
  },
  {
    Icon: FaceHandYawnIcon,
    title: 'Indifferent',
    enum: MoodEnum.Indifferent,
    tab: 'neutral',
  },
  {
    Icon: FaceFrownIcon,
    title: 'Restless',
    enum: MoodEnum.Restless,
    tab: 'neutral',
  },
  {
    Icon: FaceAnxiousSweatIcon,
    title: 'Anxious',
    tab: 'unpleasant',
    enum: MoodEnum.Anxious,
  },
  {
    Icon: FaceDisappointedIcon,
    title: 'Depressed',
    enum: MoodEnum.Depressed,
    tab: 'unpleasant',
  },
  {
    Icon: FaceMehIcon,
    title: 'Detached',
    tab: 'unpleasant',
    enum: MoodEnum.Detached,
  },
  {
    Icon: FaceMeltingIcon,
    title: 'Disoriented',
    tab: 'unpleasant',
    enum: MoodEnum.Disoriented,
  },
  {
    Icon: FaceSpiralEyesIcon,
    title: 'Escalated',
    tab: 'unpleasant',
    enum: MoodEnum.Escalated,
  },
  {
    Icon: FaceWearyIcon,
    title: 'Hopeless',
    tab: 'unpleasant',
    enum: MoodEnum.Hopeless,
  },
  {
    Icon: FaceSwearIcon,
    title: 'Manic',
    tab: 'unpleasant',
    enum: MoodEnum.Manic,
  },
  {
    Icon: FaceCloudsIcon,
    title: 'Suicidal',
    tab: 'unpleasant',
    enum: MoodEnum.Suicidal,
  },
];

const TABS: ['pleasant', 'neutral', 'unpleasant'] = [
  'pleasant',
  'neutral',
  'unpleasant',
];

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
  const { expanded, setExpanded, noteId, scrollRef } = props;
  const [images, setImages] = useState<
    Array<{ id: string | undefined; uri: string }>
  >([]);
  const [moods, setMoods] = useState<
    {
      enum: MoodEnum;
      title: string;
    }[]
  >([]);
  const [tab, setTab] = useState<'pleasant' | 'neutral' | 'unpleasant'>(
    'pleasant'
  );

  const isMood = expanded === 'Mood';
  const isLessThanOneMood = moods.length < 1;
  const isLessThanOneMoodImages = images.length < 1;
  const isGreaterThanZeroMoodImages = images?.length > 0;
  const isGreaterThanOneMood = moods.length > 0;
  const isPleasantTab = tab === 'pleasant';
  const isUnpleasantTab = tab === 'unpleasant';
  const isNeutralTab = tab === 'neutral';

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
      scrollRef={scrollRef}
      childHeight={isMood ? 'auto' : 0}
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
            {moods.map((mood: { title: string; enum: MoodEnum }) => {
              const IconComponent = ICONS[mood.title];
              return (
                <IconComponent
                  mr="xs"
                  key={mood.title}
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
          <TextMedium size="sm">Add Mood</TextMedium>
        )
      }
      title="Mood"
      expanded={expanded}
      setExpanded={() => setExpanded(isMood ? null : 'Mood')}
    >
      <View
        style={{
          paddingBottom: Spacings.md,
        }}
      >
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
              <TextRegular size="xs">
                {tabName.charAt(0).toUpperCase() + tabName.slice(1)}
              </TextRegular>
            </Pressable>
          ))}
        </View>
        <MoodSelector
          moods={moods}
          setMoods={setMoods}
          tab={tab}
          noteId={noteId}
          moodsData={MOOD_DATA}
        />
        <Attachments
          noteId={noteId}
          namespace={NoteNamespaceEnum.MoodAssessment}
          images={images}
          setImages={setImages}
        />
      </View>
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
