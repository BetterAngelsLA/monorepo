import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { StyleSheet, View } from 'react-native';

export function InputClearIcon() {
  return (
    <View style={styles.container}>
      <PlusIcon size="xs" rotate="45deg" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: Spacings.sm,
    width: Spacings.sm,
    backgroundColor: Colors.NEUTRAL_LIGHT,
    borderRadius: Radiuses.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
