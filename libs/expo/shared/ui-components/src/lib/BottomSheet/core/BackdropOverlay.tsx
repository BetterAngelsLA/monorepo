import { Pressable, StyleSheet, View } from 'react-native';

type TProps = {
  visible: boolean;
  onPress?: () => void;
};

export function BackdropOverlay(props: TProps) {
  const { visible, onPress } = props;

  if (!visible) {
    return null;
  }

  return (
    <Pressable
      accessibilityRole="button"
      style={styles.backdrop}
      onPress={onPress}
    >
      <View style={styles.overlay} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});
