import { Colors } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

export default function MainScrollContainer({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1, backgroundColor: Colors.WHITE }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 80,
          paddingTop: 24,
        }}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
