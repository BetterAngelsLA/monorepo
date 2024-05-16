import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

export default function MainContainer({
  children,
  bg,
  pt = 'md',
  px = 'sm',
}: {
  children: ReactNode;
  bg?: string;
  pt?: 'sm' | 'md' | 'lg';
  px?: 'sm' | 'md' | 0;
}) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: bg || Colors.WHITE,
          paddingHorizontal: px && Spacings[px],
          paddingBottom: 80,
          paddingTop: Spacings[pt],
        }}
      >
        {children}
      </View>
    </KeyboardAvoidingView>
  );
}
