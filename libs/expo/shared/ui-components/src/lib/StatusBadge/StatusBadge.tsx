import { Colors } from '@monorepo/expo/shared/static';
import { StyleSheet, View } from 'react-native';
import BodyText from '../BodyText';

export function StatusBadge({ title }: { title: 'Pending' | 'Accepted' }) {
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            title === 'Accepted' ? Colors.LIGHT_GREEN : Colors.YELLOW,
        },
      ]}
    >
      <BodyText size="sm">{title}</BodyText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 75,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
  },
});
