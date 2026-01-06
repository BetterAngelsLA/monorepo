import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';

export function EmptyState() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <TextRegular>No Interactions found</TextRegular>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  content: {
    marginTop: 100,
  },
});
