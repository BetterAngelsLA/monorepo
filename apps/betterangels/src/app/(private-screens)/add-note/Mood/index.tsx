import {
  Attachments,
  MoodEnum,
  NoteNamespaceEnum,
  ViewNoteQuery,
  useMoodEnumLabelsQuery,
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
type Mood = {
  Icon: ComponentType<IIconProps>;
  tab: 'pleasant' | 'neutral' | 'unpleasant';
};

interface IMoodProps {
  expanded: string | undefined | null;
  setExpanded: (expanded: string | undefined | null) => void;
  noteId: string | undefined;
  scrollRef: RefObject<ScrollView>;
  moods: ViewNoteQuery['note']['moods'];
  attachments: ViewNoteQuery['note']['attachments'];
}

const MOOD_DATA: Record<MoodEnum, Mood> = {
  [MoodEnum.Agreeable]: {
    Icon: FaceGrinWinkIcon,
    tab: 'pleasant',
  },
  [MoodEnum.Euthymic]: {
    Icon: FaceCalmIcon,
    tab: 'pleasant',
  },
  [MoodEnum.Happy]: {
    Icon: FaceLaughIcon,
    tab: 'pleasant',
  },
  [MoodEnum.Motivated]: {
    Icon: FaceGrinStarsIcon,
    tab: 'pleasant',
  },
  [MoodEnum.Optimistic]: {
    Icon: FaceSmileIcon,
    tab: 'pleasant',
  },
  [MoodEnum.Personable]: {
    Icon: FaceGrinTongueWinkIcon,
    tab: 'pleasant',
  },
  [MoodEnum.Pleasant]: {
    Icon: FaceSmileBeamIcon,
    tab: 'pleasant',
  },
  [MoodEnum.Agitated]: {
    Icon: FaceAngryIcon,
    tab: 'neutral',
  },
  [MoodEnum.DisorganizedThought]: {
    Icon: FaceEyesXmarksIcon,
    tab: 'neutral',
  },
  [MoodEnum.FlatBlunted]: {
    Icon: FaceMehBlankIcon,
    tab: 'neutral',
  },
  [MoodEnum.Indifferent]: {
    Icon: FaceRollingEyesIcon,
    tab: 'neutral',
  },
  [MoodEnum.Restless]: {
    Icon: FaceTiredIcon,
    tab: 'neutral',
  },
  [MoodEnum.Anxious]: {
    Icon: FaceGrimmaceIcon,
    tab: 'unpleasant',
  },
  [MoodEnum.Depressed]: {
    Icon: FaceFrownIcon,
    tab: 'unpleasant',
  },
  [MoodEnum.Detached]: {
    Icon: FaceMehIcon,
    tab: 'unpleasant',
  },
  [MoodEnum.Disoriented]: {
    Icon: FaceEyesXmarksIcon,
    tab: 'unpleasant',
  },
  [MoodEnum.Escalated]: {
    Icon: FaceAngryIcon,
    tab: 'unpleasant',
  },
  [MoodEnum.Hopeless]: {
    Icon: FaceTiredIcon,
    tab: 'unpleasant',
  },
  [MoodEnum.Manic]: {
    Icon: FaceAngryIcon,
    tab: 'unpleasant',
  },
  [MoodEnum.Suicidal]: {
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

  const { data, loading, error } = useMoodEnumLabelsQuery();
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
  if (!data || !('moodEnumLabels' in data)) return null;

  const moodDataWithLabels = { ...MOOD_DATA, ...data?.moodEnumLabels };
  const mergedMoodData = moodDataWithLabels.map((moodEnumLabel, index) => {
    const tmp_mood_data = MOOD_DATA[moodEnumLabel.key];
    const t = {
      Icon: tmp_mood_data.Icon,
      tab: tmp_mood_data.tab,
      id: moodEnumLabel.label,
      title: moodEnumLabel.label,
      enum: moodEnumLabel.key,
    };
    return t;
  });

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
          moods={moods}
          setMoods={setMoods}
          tab={tab}
          noteId={noteId}
          moodsData={mergedMoodData}
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
