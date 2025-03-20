import { Colors } from '@monorepo/expo/shared/static';
import { StyleProp, View, ViewStyle } from 'react-native';
import TextBold from '../TextBold';
import TextRegular from '../TextRegular';

type TProps = {
  title?: string;
  subtitle?: string;
  subtitleError?: boolean;
  required?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function FormFieldTitle(props: TProps) {
  const { style, title, required, subtitle, subtitleError } = props;

  if (!title && !subtitle) {
    return null;
  }

  return (
    <View style={style}>
      {!!title && (
        <TextBold size="lg">
          {title} {required && <TextBold color={Colors.ERROR}>*</TextBold>}
        </TextBold>
      )}

      {!!subtitle && (
        <TextRegular
          size="sm"
          color={subtitleError ? Colors.ERROR : Colors.PRIMARY_EXTRA_DARK}
        >
          {subtitle}
        </TextRegular>
      )}
    </View>
  );
}
