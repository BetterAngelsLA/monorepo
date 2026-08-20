import { Colors } from '@monorepo/expo/shared/static';
import type { PhoneNumberString } from '@monorepo/shared/scalars';
import { parsePhoneNumber, toPhoneDialString } from '@monorepo/shared/scalars';
import { Linking, Pressable, View } from 'react-native';
import TextBold from '../TextBold';

interface IPhoneNumberBtnProps {
  number: PhoneNumberString | null | undefined;
  label?: string;
}

export function PhoneNumberBtn(props: IPhoneNumberBtnProps) {
  const { number, label } = props;
  const { formatted, extension } = parsePhoneNumber(number);
  const phoneNumberUrl = toPhoneDialString(number);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Opens your phone dialer to call the number"
      accessibilityLabel={`Call ${phoneNumberUrl}`}
      onPress={() => Linking.openURL(`tel:${phoneNumberUrl}`)}
      android_ripple={null}
    >
      {({ pressed }) => (
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <TextBold
            textDecorationLine="underline"
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
              {' ext.'}
              {extension}
            </TextBold>
          )}
        </View>
      )}
    </Pressable>
  );
}
