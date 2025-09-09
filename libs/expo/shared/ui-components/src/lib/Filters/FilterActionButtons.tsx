import { StyleSheet, View, ViewStyle } from 'react-native';
import Button from '../Button';

type TProps = {
  onDone: () => void;
  onClear?: () => void;
  style?: ViewStyle;
};

export function FilterActionButtons(props: TProps) {
  const { onDone, onClear, style } = props;

  return (
    <View style={[styles.container, style]}>
      <Button
        onPress={onClear}
        size="md"
        title="Clear"
        variant="secondary"
        accessibilityHint="clear all filter selections"
      />

      <Button
        onPress={onDone}
        size="md"
        title="Done"
        variant="primary"
        accessibilityHint="apply selections filter"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
});
