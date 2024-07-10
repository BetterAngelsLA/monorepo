import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Pressable, StyleSheet, View } from 'react-native';
import TextRegular from '../TextRegular';

interface ITagProps {
  value: string;
  onRemove: () => void;
}

export function Tag(props: ITagProps) {
  const { value, onRemove } = props;
  return (
    <View style={styles.container}>
      <TextRegular>{value}</TextRegular>
      <Pressable
        accessible
        accessibilityRole="button"
        accessibilityHint="removes the tag"
        onPress={onRemove}
        style={styles.icon}
      >
        <PlusIcon size="sm" color={Colors.NEUTRAL_DARK} rotate="45deg" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.SECONDARY_LIGHT,
    borderRadius: 8,
    padding: Spacings.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  icon: {
    backgroundColor: Colors.WHITE,
    height: 20,
    width: 20,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacings.xs,
  },
});
