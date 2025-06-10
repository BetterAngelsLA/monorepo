import { Colors } from '@monorepo/expo/shared/static';
import { Linking, Pressable } from 'react-native';
import TextBold from '../TextBold';

interface IPhoneNumberBtnProps {
  text: string;
}

export function PhoneNumberBtn(props: IPhoneNumberBtnProps) {
  const { text } = props;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Opens your phone dialer to call the number"
      accessibilityLabel={`Call ${text}`}
      onPress={() => Linking.openURL(`tel:${text}`)}
      android_ripple={null}
    >
      {({ pressed }) => (
        <TextBold
          textDecorationLine="underline"
          color={pressed ? Colors.PRIMARY_LIGHT : Colors.PRIMARY_EXTRA_DARK}
          size="sm"
        >
          {text}
        </TextBold>
      )}
    </Pressable>
  );
}
