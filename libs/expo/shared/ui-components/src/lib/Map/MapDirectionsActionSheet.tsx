import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import TextBold from '../TextBold';
import TextRegular from '../TextRegular';

interface IMapDirectionsActionSheetProps {
  onSelectApple?: () => void;
  onSelectGoogle: () => void;
  onCancel: () => void;
}

export function MapDirectionsActionSheet({
  onSelectApple,
  onSelectGoogle,
  onCancel,
}: IMapDirectionsActionSheetProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {Platform.OS === 'ios' && onSelectApple && (
          <Pressable
            style={[styles.option, styles.borderBottom]}
            onPress={onSelectApple}
            accessibilityRole="button"
            accessibilityHint="opens apple maps"
          >
            <TextRegular color={Colors.PRIMARY}>Apple Maps</TextRegular>
          </Pressable>
        )}
        <Pressable
          style={styles.option}
          onPress={onSelectGoogle}
          accessibilityRole="button"
          accessibilityHint="opens google maps"
        >
          <TextRegular color={Colors.PRIMARY}>Google Maps</TextRegular>
        </Pressable>
      </View>
      <Pressable
        style={[styles.card, styles.cancel]}
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityHint="close map selection"
      >
        <TextBold color={Colors.PRIMARY}>Cancel</TextBold>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
