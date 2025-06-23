import { Colors } from '@monorepo/expo/shared/static';
import { Linking, Pressable } from 'react-native';
import TextBold from '../TextBold';

interface IPhoneNumberBtnProps {
  phoneNumber: string;
  label?: string;
}

export function PhoneNumberBtn(props: IPhoneNumberBtnProps) {
  const { phoneNumber, label } = props;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Opens your phone dialer to call the number"
      accessibilityLabel={`Call ${phoneNumber}`}
      onPress={() => Linking.openURL(`tel:${phoneNumber}`)}
      android_ripple={null}
    >
      {({ pressed }) => (
        <TextBold
          textDecorationLine="underline"
          color={pressed ? Colors.PRIMARY_LIGHT : Colors.PRIMARY_EXTRA_DARK}
          size="sm"
        >
          {label || phoneNumber}
        </TextBold>
      )}
    </Pressable>
  );
}
