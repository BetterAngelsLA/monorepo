import { CheckIcon, CopyIcon, TIconSize } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses } from '@monorepo/expo/shared/static';
import * as Clipboard from 'expo-clipboard';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';

const COPIED_FEEDBACK_DURATION_MS = 2000;

interface ICopyButtonProps {
  textToCopy?: string | null;
  size?: TIconSize | number;
  containerStyle?: StyleProp<ViewStyle>;
  copiedStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

export function CopyButton(props: ICopyButtonProps) {
  const {
    textToCopy,
    size = 'sm',
    containerStyle,
    copiedStyle,
    testID,
  } = props;

  const [copied, setCopied] = useState(false);
  const feedbackIconTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const feedbackFlashTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const isDisabled = !textToCopy?.trim();
  const Icon = copied ? CheckIcon : CopyIcon;

  const iconColor = isDisabled
    ? Colors.NEUTRAL
    : copied
      ? Colors.SUCCESS_DARK
      : Colors.PRIMARY_EXTRA_DARK;

  useEffect(() => {
    return () => {
      if (feedbackIconTimeout.current) {
        clearTimeout(feedbackIconTimeout.current);
      }
    };
  }, []);

  const onPress = async () => {
    if (isDisabled || !textToCopy) {
      return;
    }

    try {
      await Clipboard.setStringAsync(textToCopy);
      setCopied(true);

      if (feedbackIconTimeout.current) {
        clearTimeout(feedbackIconTimeout.current);
      }

      if (feedbackFlashTimeout.current) {
        clearTimeout(feedbackFlashTimeout.current);
      }

      feedbackIconTimeout.current = setTimeout(() => {
        setCopied(false);
        feedbackIconTimeout.current = null;
      }, COPIED_FEEDBACK_DURATION_MS);
    } catch (error) {
      console.error('Failed to copy to clipboard', error);
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={copied ? 'Copied to clipboard' : 'Copy to clipboard'}
      accessibilityHint="Copies the text to the clipboard"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      hitSlop={8}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.container,
        isDisabled && styles.disabled,
        containerStyle,
        copied && copiedStyle,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      <Icon size={size} color={iconColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: Radiuses.xxxl,
    borderWidth: 1,
    borderColor: Colors.PRIMARY_EXTRA_LIGHT,
    backgroundColor: Colors.PRIMARY_SUPER_LIGHT,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.7,
  },
});
