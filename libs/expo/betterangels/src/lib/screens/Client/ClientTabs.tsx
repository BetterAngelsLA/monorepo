import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextButton } from '@monorepo/expo/shared/ui-components';
import { ScrollView, View } from 'react-native';

interface IClientTabsProps {
  tab: string;
  setTab: (tab: string) => void;
}

const TABS = ['Profile', 'Docs', 'Interactions', 'Tasks', 'Services'];

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
          <TextButton
            onPress={() => setTab(t)}
            style={{
              padding: Spacings.sm,
              borderBottomWidth: t === tab ? 3 : 0,
              borderColor: Colors.PRIMARY,
            }}
            regular={t !== tab}
            title={t}
            key={t}
            accessibilityHint={`select ${t} tab`}
          />
        ))}
      </ScrollView>
    </View>
  );
}
