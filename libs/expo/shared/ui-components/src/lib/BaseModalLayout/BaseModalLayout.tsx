import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Button, TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import React from 'react';
import { Platform, View, ViewStyle } from 'react-native';
import { KeyboardAwareScrollView, KeyboardToolbar } from 'react-native-keyboard-controller';

interface BaseModalLayoutProps {
  title?: string;
  subtitle?: string;
  scrollable?: boolean;
  children: React.ReactNode;
  onSubmit?: () => void;
  onReset?: () => void;
  submitText?: string;
  resetText?: string;
  isSubmitting?: boolean;
  showFooter?: boolean;
  contentStyle?: ViewStyle;
  submitAccessibilityHint?: string;
  resetAccessibilityHint?: string;
}

export default function BaseModalLayout({
  title,
  subtitle,
  scrollable = true,
  children,
  onSubmit,
  onReset,
  submitText = 'Done',
  resetText = 'Reset',
  isSubmitting = false,
  showFooter = true,
  contentStyle = {},
  submitAccessibilityHint = 'submit changes',
  resetAccessibilityHint = 'reset form values',
}: BaseModalLayoutProps) {
  const Wrapper = scrollable ? KeyboardAwareScrollView : View;

  return (
    <>
      <Wrapper
        style={{ flex: 1, backgroundColor: Colors.WHITE }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'flex-start',
          paddingBottom: Spacings.xl + 80,
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

      {showFooter && (
        <View
          style={{
            flexDirection: 'row',
            gap: Spacings.xs,
            width: '100%',
            paddingTop: Spacings.sm,
            paddingBottom: Spacings.sm,
            alignItems: 'center',
            paddingHorizontal: Spacings.md,
            backgroundColor: Colors.WHITE,
            shadowColor: Colors.BLACK,
            shadowOffset: { width: 0, height: -5 },
            shadowOpacity: 0.05,
            shadowRadius: 3.84,
            elevation: 1,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
          }}
        >
          {onReset && (
            <View style={{ flex: 1 }}>
              <Button
                onPress={onReset}
                size="full"
                variant="secondary"
                title={resetText}
                accessibilityHint={resetAccessibilityHint}
              />
            </View>
          )}
          {onSubmit && (
            <View style={{ flex: 1 }}>
              <Button
                disabled={isSubmitting}
                loading={isSubmitting}
                onPress={onSubmit}
                size="full"
                variant="primary"
                title={submitText}
                accessibilityHint={submitAccessibilityHint}
              />
            </View>
          )}
        </View>
      )}

      <KeyboardToolbar content={<View />} showArrows={false} />
    </>
  );
}

