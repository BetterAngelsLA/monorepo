import { Colors, FontSizes, Spacings } from '@monorepo/expo/shared/static';
import { TextButton } from '@monorepo/expo/shared/ui-components';
import { useMemo, useState } from 'react';
import {
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFeatureFlagActive } from '../../hooks';
import { FeatureFlags } from '../../providers';

export enum ClientViewTabEnum {
  Profile = 'Profile',
  Docs = 'Docs',
  Interactions = 'Interactions',
  Locations = 'Locations',
  Tasks = 'Tasks',
}

const orderedTabs: ClientViewTabEnum[] = [
  ClientViewTabEnum.Profile,
  ClientViewTabEnum.Docs,
  ClientViewTabEnum.Interactions,
  ClientViewTabEnum.Locations,
];

const orderedTabsWithTasks: ClientViewTabEnum[] = [
  ClientViewTabEnum.Profile,
  ClientViewTabEnum.Interactions,
  ClientViewTabEnum.Tasks,
  ClientViewTabEnum.Docs,
  ClientViewTabEnum.Locations,
];

interface IClientTabsProps {
  selectedTab: ClientViewTabEnum;
  setTab: (tab: ClientViewTabEnum) => void;
}

export default function ClientTabs({ selectedTab, setTab }: IClientTabsProps) {
  const tasksFeatureOn = useFeatureFlagActive(FeatureFlags.TASKS_FF);
  const visibleTabs = tasksFeatureOn ? orderedTabsWithTasks : orderedTabs;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {visibleTabs.map((t) => (
          <TabItem
            key={t}
            label={t}
            active={t === selectedTab}
            onPress={() => setTab(t)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

/** ---------- Single Tab (fixed width = bold width, keep TextButton styling) ---------- */
type TabItemProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

function TabItem({ label, active, onPress }: TabItemProps) {
  const [boldW, setBoldW] = useState<number | null>(null);

  const onBoldMeasure = (e: LayoutChangeEvent) => {
    if (boldW == null) setBoldW(Math.ceil(e.nativeEvent.layout.width));
  };

  const tabWidthStyle = useMemo(
    () =>
      boldW != null ? ({ width: boldW + PADDING_H * 2 } as const) : undefined,
    [boldW]
  );

  const btnStyle = useMemo(
    () => StyleSheet.flatten([styles.textBtn, tabWidthStyle]),
    [tabWidthStyle]
  );

  return (
    <View
      style={[
        styles.tab,
        { borderBottomColor: active ? Colors.PRIMARY : 'transparent' },
      ]}
    >
      {/* Hidden measurer uses bold metrics to lock width */}
      <Text
        style={styles.hiddenMeasureBold}
        onLayout={onBoldMeasure}
        numberOfLines={1}
      >
        {label}
      </Text>

      {/* Visible control = original TextButton (keeps exact colors/regular prop behavior) */}
      <TextButton
        onPress={onPress}
        style={btnStyle}
        regular={!active}
        title={label}
        accessibilityHint={`select ${label} tab`}
      />
    </View>
  );
}

/** ---- Layout constants to keep row perfectly stable ---- */
const PADDING_H = Spacings.sm;
const TAB_VPAD = Spacings.sm;
const TAB_LINE = FontSizes.md.lineHeight;
const TAB_FONT = FontSizes.md.fontSize;
const TAB_HEIGHT =
  Math.ceil(typeof TAB_LINE === 'number' ? TAB_LINE : Number(TAB_LINE)) +
  TAB_VPAD * 2;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.WHITE,
    borderTopWidth: 1,
    borderColor: Colors.NEUTRAL_LIGHT,
  },
  scrollContent: {
    backgroundColor: Colors.WHITE,
  },

  tab: {
    borderColor: Colors.PRIMARY,
    borderBottomWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },

  textBtn: {
    paddingHorizontal: PADDING_H,
    paddingVertical: TAB_VPAD,
    minHeight: TAB_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },

  hiddenMeasureBold: {
    position: 'absolute',
    opacity: 0,
    left: -9999,
    top: -9999,
    letterSpacing: 0.4,
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
    fontSize: TAB_FONT,
    lineHeight: TAB_LINE,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
