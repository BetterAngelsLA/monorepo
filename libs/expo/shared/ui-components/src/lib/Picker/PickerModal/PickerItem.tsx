import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { Pressable, StyleSheet, View } from 'react-native';
import TextRegular from '../../TextRegular';

type INavButton = {
  value: string;
  displayValue?: string;
  onPress: (value: string) => void;
};

export function PickerItem(props: INavButton) {
  const { onPress, value, displayValue } = props;

  return (
    <Pressable
      onPress={() => onPress(value)}
      accessibilityRole="button"
      style={styles.container}
    >
      {({ pressed }) => (
        <View
          style={[
            {
              backgroundColor: pressed
                ? Colors.NEUTRAL_EXTRA_LIGHT
                : Colors.WHITE,
            },
            styles.pressedView,
          ]}
        >
          <View style={styles.content}>
            <TextRegular>{displayValue || value}</TextRegular>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radiuses.xs,
    backgroundColor: Colors.WHITE,
  },
  pressedView: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    borderRadius: Radiuses.xs,
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.sm,
  },
  leftIcon: {
    marginRight: Spacings.sm,
  },
  content: {
    display: 'flex',
    marginRight: 'auto',
  },
});
