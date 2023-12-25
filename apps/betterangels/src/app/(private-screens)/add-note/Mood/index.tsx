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
} from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { BodyText, FieldCard, H5 } from '@monorepo/expo/shared/ui-components';
import { ReactNode, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';
import Neutral from './Neutral';
import Pleasant from './Pleasant';
import Unpleasant from './Unpleasant';

interface IMoodProps {
  expanded: string | undefined;
  setExpanded: (e: string | undefined) => void;
}

const SELECTED_TAB: { [key: string]: ReactNode } = {
  pleasant: <Pleasant />,
  unpleasant: <Unpleasant />,
  neutral: <Neutral />,
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
  const { expanded, setExpanded } = props;
  const [tab, setTab] = useState<string>('pleasant');
  const { watch } = useFormContext();

  const moods = watch('moods') || [];

  const getColor = (tabName: string, light: boolean) => {
    switch (tabName) {
      case 'pleasant':
        return tab === 'pleasant'
          ? light
            ? Colors.SUCCESS_EXTRA_LIGHT
            : Colors.SUCCESS
          : 'transparent';
      case 'unpleasant':
        return tab === 'unpleasant'
          ? light
            ? Colors.ERROR_EXTRA_LIGHT
            : Colors.ERROR
          : 'transparent';
      case 'neutral':
        return tab === 'neutral'
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
        expanded === 'Mood' && moods.length < 1 ? (
          ''
        ) : moods.length > 0 ? (
          <View style={{ flexDirection: 'row' }}>
            {moods.map((mood: string) => {
              const IconComponent = ICONS[mood];
              return (
                <IconComponent
                  ml="xs"
                  key={mood}
                  size="sm"
                  color={Colors.PRIMARY_EXTRA_DARK}
                />
              );
            })}
          </View>
        ) : (
          <H5 size="sm">Add Mood</H5>
        )
      }
      title="Mood"
      expanded={expanded}
      setExpanded={() => setExpanded(expanded === 'Mood' ? undefined : 'Mood')}
    >
      {expanded === 'Mood' && (
        <>
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
          {SELECTED_TAB[tab]}
        </>
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
