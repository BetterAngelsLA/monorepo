import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

export default function MainScrollContainer({
  children,
  bg,
  pt = 'md',
  px = 'sm',
}: {
  children: ReactNode;
  bg?: string;
  pt?: 'sm' | 'md';
  px?: 'sm' | 'md' | 0;
}) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1, backgroundColor: bg || Colors.WHITE }}
        contentContainerStyle={{
          paddingHorizontal: px && Spacings[px],
          paddingBottom: 80,
          paddingTop: Spacings[pt],
        }}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
