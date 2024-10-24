import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode, forwardRef } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

interface IMainScrollContainerProps {
  children: ReactNode;
  bg?: string;
  pt?: 'sm' | 'md' | 'lg' | 0;
  px?: 'sm' | 'md' | 0;
  pb?: number;
  keyboardAware?: boolean;
}

const MainScrollContainer = forwardRef<ScrollView, IMainScrollContainerProps>(
  (props: IMainScrollContainerProps, ref) => {
    const {
      bg = Colors.WHITE,
      pt = 'md',
      px = 'sm',
      pb = 80,
      keyboardAware,
      children,
    } = props;

    const ViewContainer = keyboardAware ? KeyboardAwareScrollView : ScrollView;

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ViewContainer
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
        </ViewContainer>
      </KeyboardAvoidingView>
    );
  }
);

export default MainScrollContainer;
