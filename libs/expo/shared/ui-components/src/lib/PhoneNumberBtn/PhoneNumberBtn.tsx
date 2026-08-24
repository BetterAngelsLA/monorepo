import { Colors } from '@monorepo/expo/shared/static';
import { toPhoneParts, type PhoneNumberString } from '@monorepo/shared/scalars';
import { Linking, Pressable, View } from 'react-native';
import TextBold from '../TextBold';

interface IPhoneNumberBtnProps {
  number: PhoneNumberString | null | undefined;
  label?: string;
}

export function PhoneNumberBtn(props: IPhoneNumberBtnProps) {
  const { number, label } = props;
  const { formatted, extension, display, dial } = toPhoneParts(number);

  const content = (pressed: boolean) => (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <TextBold
        textDecorationLine={dial ? 'underline' : 'none'}
        color={pressed ? Colors.PRIMARY_LIGHT : Colors.PRIMARY_EXTRA_DARK}
        size="sm"
      >
        {label || formatted}
      </TextBold>
      {extension && (
        <TextBold
          color={pressed ? Colors.PRIMARY_LIGHT : Colors.PRIMARY_EXTRA_DARK}
          size="sm"
        >
          {' ext. '}
          {extension}
        </TextBold>
      )}
    </View>
  );

  if (!dial) {
    return content(false);
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Opens your phone dialer to call the number"
      accessibilityLabel={`Call ${label || display}`}
      onPress={() => Linking.openURL(`tel:${dial}`)}
      android_ripple={null}
    >
      {({ pressed }) => content(pressed)}
    </Pressable>
  );
}
