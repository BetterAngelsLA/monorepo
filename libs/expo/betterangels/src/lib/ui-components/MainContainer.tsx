import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

export default function MainContainer({
  children,
  bg,
  pt = 'md',
  px = 'sm',
  pb = 80,
  testId,
}: {
  children: ReactNode;
  bg?: string;
  pt?: 'sm' | 'md' | 'lg' | 0;
  px?: 'sm' | 'md' | 0;
  pb?: 0 | 80;
  testId?: string;
}) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View
        testID={testId}
        style={{
          flex: 1,
          backgroundColor: bg || Colors.WHITE,
          paddingHorizontal: px && Spacings[px],
          paddingBottom: pb,
          paddingTop: pt && Spacings[pt],
        }}
      >
        {children}
      </View>
    </KeyboardAvoidingView>
  );
}
