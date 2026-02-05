import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { Pressable, StyleSheet, View } from 'react-native';

interface DirectionsPickerProps {
  onSelectApple: () => void;
  onSelectGoogle: () => void;
  onCancel: () => void;
}

export function DirectionsPicker({
  onSelectApple,
  onSelectGoogle,
  onCancel,
}: DirectionsPickerProps) {
  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Pressable
          style={[styles.option, styles.borderBottom]}
          onPress={onSelectApple}
          accessibilityRole="button"
        >
          <TextRegular color={Colors.PRIMARY}>Apple Maps</TextRegular>
        </Pressable>
        <Pressable
          style={styles.option}
          onPress={onSelectGoogle}
          accessibilityRole="button"
        >
          <TextRegular color={Colors.PRIMARY}>Google Maps</TextRegular>
        </Pressable>
      </View>
      <Pressable
        style={[styles.card, styles.cancel]}
        onPress={onCancel}
        accessibilityRole="button"
      >
        <TextBold color={Colors.PRIMARY}>Cancel</TextBold>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 0,
    zIndex: 1001,
    width: '100%',
    paddingBottom: Spacings.sm,
    paddingHorizontal: Spacings.sm,
  },
  card: {
    backgroundColor: Colors.WHITE,
    borderRadius: 8,
    marginBottom: Spacings.xs,
    shadowColor: Colors.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  option: {
    padding: Spacings.sm,
    alignItems: 'center',
  },
  borderBottom: {
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.NEUTRAL_LIGHT,
  },
  cancel: {
    padding: Spacings.sm,
    alignItems: 'center',
  },
});
