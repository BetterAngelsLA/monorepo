import { XmarkIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { Pressable, StyleSheet, View } from 'react-native';
import BodyText from '../BodyText';

interface ITagProps {
  value: string;
  onRemove: () => void;
}

export function Tag(props: ITagProps) {
  const { value, onRemove } = props;
  return (
    <View style={styles.container}>
      <BodyText>{value}</BodyText>
      <Pressable onPress={onRemove} style={styles.icon}>
        <XmarkIcon size="sm" color={Colors.DARK_GRAY} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.LIGHT_PURPLE,
    borderRadius: 3,
    padding: 8,
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
    marginLeft: 8,
  },
});
