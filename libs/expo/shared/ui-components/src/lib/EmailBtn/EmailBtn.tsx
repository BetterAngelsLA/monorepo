import { Colors } from '@monorepo/expo/shared/static';
import { Linking, Pressable } from 'react-native';
import TextBold from '../TextBold';

interface IEmailBtnProps {
  text: string;
}

export function EmailBtn(props: IEmailBtnProps) {
  const { text } = props;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Opens your email client to send an email"
      accessibilityLabel={`Email ${text}`}
      onPress={() => Linking.openURL(`mailto:${text}`)}
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
