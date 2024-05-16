import {
  Attachments,
  MoodEnum,
  NoteNamespaceEnum,
  ViewNoteQuery,
} from '@monorepo/expo/betterangels';
import {
  FaceAngryIcon,
  FaceCalmIcon,
  FaceDisappointedIcon,
  FaceEyesXmarksIcon,
  FaceFrownIcon,
  FaceGrimmaceIcon,
  FaceGrinStarsIcon,
  FaceGrinTongueWinkIcon,
  FaceGrinWinkIcon,
  FaceLaughIcon,
  FaceMehBlankIcon,
  FaceMehIcon,
  FacePoutingIcon,
  FaceRollingEyesIcon,
  FaceSmileBeamIcon,
  FaceSmileIcon,
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
import { ComponentType, RefObject, useEffect, useState } from 'react';
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
  moods: ViewNoteQuery['note']['moods'];
  attachments: ViewNoteQuery['note']['attachments'];
}

const MOOD_DATA: Mood[] = [
  {
    Icon: FaceGrinWinkIcon,
    title: 'Agreeable',
    enum: MoodEnum.Agreeable,
    tab: 'pleasant',
  },
  {
    Icon: FaceCalmIcon,
    title: 'Euthymic',
    enum: MoodEnum.Euthymic,
    tab: 'pleasant',
  },
  {
    Icon: FaceLaughIcon,
    title: 'Happy',
    tab: 'pleasant',
    enum: MoodEnum.Happy,
  },
  {
    Icon: FaceGrinStarsIcon,
    title: 'Motivated',
    tab: 'pleasant',
    enum: MoodEnum.Motivated,
  },
  {
    Icon: FaceSmileIcon,
    title: 'Optimistic',
    tab: 'pleasant',
    enum: MoodEnum.Optimistic,
  },
  {
    Icon: FaceGrinTongueWinkIcon,
    title: 'Personable',
    enum: MoodEnum.Personable,
    tab: 'pleasant',
  },
  {
    Icon: FaceSmileBeamIcon,
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
    Icon: FaceEyesXmarksIcon,
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
    Icon: FaceRollingEyesIcon,
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
    Icon: FaceGrimmaceIcon,
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
    Icon: FaceEyesXmarksIcon,
    title: 'Disoriented',
    tab: 'unpleasant',
    enum: MoodEnum.Disoriented,
  },
  {
    Icon: FaceAngryIcon,
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
    Icon: FaceAngryIcon,
    title: 'Manic',
    tab: 'unpleasant',
    enum: MoodEnum.Manic,
  },
  {
    Icon: FaceEyesXmarksIcon,
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
  AGREEABLE: FaceGrinWinkIcon,
  EUTHYMIC: FaceCalmIcon,
  HAPPY: FaceLaughIcon,
  MOTIVATED: FaceGrinStarsIcon,
  OPTIMISTIC: FaceSmileIcon,
  PERSONABLE: FaceGrinTongueWinkIcon,
  PLEASANT: FaceSmileBeamIcon,
  ANXIOUS: FaceGrimmaceIcon,
  DEPRESSED: FaceDisappointedIcon,
  DETACHED: FaceMehIcon,
  DISORIENTED: FaceEyesXmarksIcon,
  ESCALATED: FaceAngryIcon,
  HOPELESS: FaceWearyIcon,
  MANIC: FaceAngryIcon,
  SUICIDAL: FaceEyesXmarksIcon,
  AGITATED: FacePoutingIcon,
  DISORGANIZED_THOUGHT: FaceEyesXmarksIcon,
  FLAT_BLUNTED: FaceMehBlankIcon,
  INDIFFERENT: FaceRollingEyesIcon,
  RESTLESS: FaceFrownIcon,
};

export default function Mood(props: IMoodProps) {
  const {
    expanded,
    setExpanded,
    noteId,
    moods: initialMoods,
    attachments,
    scrollRef,
  } = props;

  const [images, setImages] = useState<
    Array<{ id: string | undefined; uri: string }> | undefined
  >(undefined);
  const [moods, setMoods] = useState<
    | {
        id: string | undefined;
        enum: MoodEnum;
      }[]
    | undefined
  >(undefined);
  const [tab, setTab] = useState<'pleasant' | 'neutral' | 'unpleasant'>(
    'pleasant'
  );

  const isMood = expanded === 'Mood';
  const isLessThanOneMood = moods && moods.length < 1;
  const isLessThanOneMoodImages = images && images.length < 1;
  const isGreaterThanZeroMoodImages = images && images?.length > 0;
  const isGreaterThanOneMood = moods && moods.length > 0;
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

  useEffect(() => {
    if (initialMoods.length === 0) {
      setMoods([]);
      return;
    }

    const filteredMoods = initialMoods.map((item) => ({
      enum: item.descriptor,
      id: item.id,
    }));
    setMoods(filteredMoods);
  }, [initialMoods]);

  useEffect(() => {
    if (attachments.length === 0) {
      setImages([]);
      return;
    }
    const newImages = attachments.map((attachment) => ({
      id: attachment.id,
      uri: attachment.file.url,
    }));
    setImages(newImages);
  }, [attachments]);

  if (!moods || !images) return null;

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
            {moods.map((mood: { enum: MoodEnum }) => {
              const IconComponent = ICONS[mood.enum];
              return (
                <IconComponent
                  mr="xs"
                  key={mood.enum}
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
      <View>
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
