import { Colors } from '@monorepo/expo/shared/static';
import { Linking, Pressable, View } from 'react-native';
import TextBold from '../TextBold';

interface IPhoneNumberBtnProps {
  number: Array<string | undefined>;
  label?: string;
}

export function PhoneNumberBtn(props: IPhoneNumberBtnProps) {
  const { number, label } = props;
  const [phoneNumber, extension] = number;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Opens your phone dialer to call the number"
      accessibilityLabel={`Call ${phoneNumber}`}
      onPress={() => Linking.openURL(`tel:${phoneNumber},${extension}`)}
      android_ripple={null}
    >
      {({ pressed }) => (
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <TextBold
            textDecorationLine="underline"
            color={pressed ? Colors.PRIMARY_LIGHT : Colors.PRIMARY_EXTRA_DARK}
            size="sm"
          >
            {label || phoneNumber}
          </TextBold>
          {extension && (
            <TextBold
              color={pressed ? Colors.PRIMARY_LIGHT : Colors.PRIMARY_EXTRA_DARK}
              size="sm"
            >
              {' ext.'}
              {extension}
            </TextBold>
          )}
        </View>
      )}
    </Pressable>
  );
}
