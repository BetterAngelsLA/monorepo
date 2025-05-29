import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, View, ViewStyle } from 'react-native';
import { KeyboardAwareScrollView, KeyboardToolbar } from 'react-native-keyboard-controller';

interface BaseModalLayoutProps {
  title?: string;
  subtitle?: string;
  scrollable?: boolean;
  children: React.ReactNode;
  contentStyle?: ViewStyle;
}

export default function BaseModalLayout({
  title,
  subtitle,
  scrollable = true,
  children,
  contentStyle = {},
}: BaseModalLayoutProps) {
  const Wrapper = scrollable ? KeyboardAwareScrollView : View;
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Wrapper
        style={{ backgroundColor: Colors.WHITE }}
        contentContainerStyle={{
          justifyContent: 'flex-start',
          paddingHorizontal: Spacings.md,
          ...(contentStyle || {}),
        }}
        keyboardShouldPersistTaps="handled"
        enabled
        extraKeyboardSpace={Platform.OS === 'ios' ? 0 : 100}
      >
        {(title || subtitle) && (
          <View>
            {title && <TextBold size="lg">{title}</TextBold>}
            {subtitle && <TextRegular mt="xxs" mb="sm">{subtitle}</TextRegular>}
          </View>
        )}
        {children}
      </Wrapper>
      {keyboardVisible && <KeyboardToolbar content={<View />} showArrows={false} />}
    </View>
  );
}
