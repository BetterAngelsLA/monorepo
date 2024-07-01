import {
  Attachments,
  MoodEnum,
  NoteNamespaceEnum,
  ViewNoteQuery,
} from '@monorepo/expo/betterangels';
import {
  FaceAngryIcon,
  FaceCalmIcon,
  FaceEyesXmarksIcon,
  FaceFrownIcon,
  FaceGrimmaceIcon,
  FaceGrinStarsIcon,
  FaceGrinTongueWinkIcon,
  FaceGrinWinkIcon,
  FaceLaughIcon,
  FaceMehBlankIcon,
  FaceMehIcon,
  FaceRollingEyesIcon,
  FaceSmileBeamIcon,
  FaceSmileIcon,
  FaceTiredIcon,
  PaperclipIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  FieldCard,
  TextMedium,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { RefObject, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import MoodSelector from './MoodSelector';
import { MoodAttributes } from './types';

interface IMoodProps {
  expanded: string | undefined | null;
  setExpanded: (expanded: string | undefined | null) => void;
  noteId: string | undefined;
  scrollRef: RefObject<ScrollView>;
  moods: ViewNoteQuery['note']['moods'];
  attachments: ViewNoteQuery['note']['attachments'];
}

const MOOD_DATA: Record<MoodEnum, MoodAttributes> = {
  [MoodEnum.Agreeable]: {
    title: 'Agreeable',
    Icon: FaceGrinWinkIcon,
    tab: 'pleasant',
  },
  [MoodEnum.Euthymic]: {
    title: 'Euthymic',
    Icon: FaceCalmIcon,
    tab: 'pleasant',
  },
  [MoodEnum.Happy]: {
    title: 'Happy',
    Icon: FaceLaughIcon,
    tab: 'pleasant',
  },
  [MoodEnum.Motivated]: {
    title: 'Motivated',
    Icon: FaceGrinStarsIcon,
    tab: 'pleasant',
  },
  [MoodEnum.Optimistic]: {
    title: 'Optimistic',
    Icon: FaceSmileIcon,
    tab: 'pleasant',
  },
  [MoodEnum.Personable]: {
    title: 'Personable',
    Icon: FaceGrinTongueWinkIcon,
    tab: 'pleasant',
  },
  [MoodEnum.Pleasant]: {
    title: 'Pleasant',
    Icon: FaceSmileBeamIcon,
    tab: 'pleasant',
  },
  [MoodEnum.Agitated]: {
    title: 'Agitated',
    Icon: FaceAngryIcon,
    tab: 'neutral',
  },
  [MoodEnum.DisorganizedThought]: {
    title: 'Disorganized Thought',
    Icon: FaceEyesXmarksIcon,
    tab: 'neutral',
  },
  [MoodEnum.FlatBlunted]: {
    title: 'Flat/blunted',
    Icon: FaceMehBlankIcon,
    tab: 'neutral',
  },
  [MoodEnum.Indifferent]: {
    title: 'Indifferent',
    Icon: FaceRollingEyesIcon,
    tab: 'neutral',
  },
  [MoodEnum.Restless]: {
    title: 'Restless',
    Icon: FaceTiredIcon,
    tab: 'neutral',
  },
  [MoodEnum.Anxious]: {
    title: 'Anxious',
    Icon: FaceGrimmaceIcon,
    tab: 'unpleasant',
  },
  [MoodEnum.Depressed]: {
    title: 'Depressed',
    Icon: FaceFrownIcon,
    tab: 'unpleasant',
  },
  [MoodEnum.Detached]: {
    title: 'Detached',
    Icon: FaceMehIcon,
    tab: 'unpleasant',
  },
  [MoodEnum.Disoriented]: {
    title: 'Disoriented',
    Icon: FaceEyesXmarksIcon,
    tab: 'unpleasant',
  },
  [MoodEnum.Escalated]: {
    title: 'Escalated',
    Icon: FaceAngryIcon,
    tab: 'unpleasant',
  },
  [MoodEnum.Hopeless]: {
    title: 'Hopeless',
    Icon: FaceTiredIcon,
    tab: 'unpleasant',
  },
  [MoodEnum.Manic]: {
    title: 'Manic',
    Icon: FaceAngryIcon,
    tab: 'unpleasant',
  },
  [MoodEnum.Suicidal]: {
    title: 'Suicidal',
    Icon: FaceEyesXmarksIcon,
    tab: 'unpleasant',
  },
};
const TABS: ['pleasant', 'neutral', 'unpleasant'] = [
  'pleasant',
  'neutral',
  'unpleasant',
];

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
              gap: Spacings.xxs,
            }}
          >
            {moods.map((mood: { enum: MoodEnum }) => {
              const IconComponent = MOOD_DATA[mood.enum].Icon;
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
          // moodsData={moods}
          // setMoods={setMoods}
          noteId={noteId}
          tab={tab}
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
