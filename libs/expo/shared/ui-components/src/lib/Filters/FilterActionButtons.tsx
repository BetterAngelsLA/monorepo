import { StyleSheet, View, ViewStyle } from 'react-native';
import Button from '../Button';

type TProps = {
  onDone: () => void;
  onClear?: () => void;
  style?: ViewStyle;
  doneLabel?: string;
  cancelLabel?: string;
  btnSize?: 'sm' | 'md' | 'full' | 'auto';
};

export function FilterActionButtons(props: TProps) {
  const {
    onDone,
    onClear,
    doneLabel = 'Done',
    cancelLabel = 'Clear',
    btnSize = 'md',
    style,
  } = props;

  return (
    <View style={[styles.container, style]}>
      <Button
        onPress={onClear}
        size={btnSize}
        title={doneLabel}
        variant="secondary"
        accessibilityHint="clear all filter selections"
      />

      <Button
        onPress={onDone}
        size={btnSize}
        title={cancelLabel}
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
