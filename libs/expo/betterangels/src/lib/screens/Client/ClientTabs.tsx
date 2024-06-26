import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextButton } from '@monorepo/expo/shared/ui-components';
import { ScrollView, View } from 'react-native';

interface IClientTabsProps {
  tab: string;
  setTab: (tab: string) => void;
}

const TABS = [
  // 'Profile',
  // 'Docs',
  'Interactions',
  // 'Tasks',
  // 'Services',
  // 'Schedule',
  // 'Locations',
];

export default function ClientTabs(props: IClientTabsProps) {
  const { tab, setTab } = props;
  return (
    <View
      style={{
        backgroundColor: Colors.WHITE,
        borderTopWidth: 1,
        borderColor: Colors.NEUTRAL_LIGHT,
      }}
    >
      <ScrollView
        contentContainerStyle={{ backgroundColor: Colors.WHITE }}
        showsHorizontalScrollIndicator={false}
        horizontal
      >
        {TABS.map((t) => (
          <View
            style={{
              position: 'relative',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottomWidth: t === tab ? 3 : 0,
              borderColor: Colors.PRIMARY,
            }}
            key={t}
          >
            <TextButton
              onPress={() => setTab(t)}
              style={{
                position: 'absolute',
                zIndex: 100,
                padding: Spacings.sm,
              }}
              regular={t !== tab}
              title={t}
              accessibilityHint={`select ${t} tab`}
            />
            <TextButton
              style={{ opacity: 0, padding: Spacings.sm }}
              title={t}
              accessibilityHint={`select ${t} tab`}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
