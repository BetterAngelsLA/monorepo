import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { StyleSheet, Text, View } from 'react-native';
import TextRegular from '../TextRegular';

interface IFormFieldLabel {
  label: string;
  required?: boolean;
}

export function FormFieldLabel(props: IFormFieldLabel) {
  const { label, required } = props;
  return (
    <View style={styles.container}>
      <TextRegular size="sm" color={Colors.PRIMARY_EXTRA_DARK}>
        {label}
      </TextRegular>
      {required && <Text style={styles.required}>*</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: Spacings.xs,
  },

  required: {
    marginLeft: 2,
    color: Colors.ERROR,
  },
});
