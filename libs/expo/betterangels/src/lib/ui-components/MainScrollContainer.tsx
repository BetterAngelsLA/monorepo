import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode, forwardRef } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

interface IMainScrollContainerProps {
  children: ReactNode;
  bg?: string;
  pt?: 'sm' | 'md' | 'lg' | 0;
  px?: 'sm' | 'md' | 0;
  pb?: number;
}

const MainScrollContainer = forwardRef<ScrollView, IMainScrollContainerProps>(
  ({ children, bg = Colors.WHITE, pt = 'md', px = 'sm', pb = 80 }, ref) => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        ref={ref}
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1, backgroundColor: bg }}
        contentContainerStyle={{
          paddingHorizontal: px ? Spacings[px] : undefined,
          paddingBottom: pb,
          paddingTop: pt && Spacings[pt],
          flexGrow: 1,
        }}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  )
);

export default MainScrollContainer;
