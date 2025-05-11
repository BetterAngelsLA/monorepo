import { ThreeDotIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import Tooltip from 'react-native-walkthrough-tooltip';
import { ClientNavMenuContent } from './ClientNavMenuContent';

type TProps = {
  clientProfileId?: string;
};
export function ClientNavMenu(props: TProps) {
  const { clientProfileId } = props;

  const [menuVisible, setMenuVisible] = useState(false);

  function toggleMenu() {
    setMenuVisible((prev) => {
      return !prev;
    });
  }

  return (
    <Tooltip
      isVisible={menuVisible}
      backgroundColor="transparent"
      placement="bottom"
      disableShadow={true}
      onClose={() => setMenuVisible(false)}
      arrowSize={{
        width: 0,
        height: 0,
      }}
      displayInsets={{
        top: 0,
        bottom: 0,
        left: 0,
        right: 12,
      }}
      tooltipStyle={[
        styles.contentWrapper,
        {
          marginTop: Platform.OS === 'android' ? 14 : 8,
        },
      ]}
      contentStyle={styles.content}
      content={
        <ClientNavMenuContent
          clientProfileId={clientProfileId}
          onItemClick={() => setMenuVisible(false)}
        />
      }
    >
      <Pressable
        accessibilityRole="button"
        accessibilityHint="toggle client profile menu"
        onPress={toggleMenu}
      >
        {({ pressed }) => (
          <ThreeDotIcon
            size="lg"
            color={pressed ? Colors.NEUTRAL_DARK : Colors.WHITE}
          />
        )}
      </Pressable>
    </Tooltip>
  );
}

const styles = StyleSheet.create({
  contentWrapper: {
    backgroundColor: Colors.WHITE,
    shadowColor: Colors.BLACK,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    borderRadius: 12,
    elevation: 12, // android
  },
  content: {
    padding: 0,
    borderRadius: 12,
    height: 'auto',
    overflow: 'hidden',
  },
});
