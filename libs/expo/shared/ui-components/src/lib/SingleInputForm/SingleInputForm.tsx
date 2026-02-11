import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  Button,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

const DEFAULT_PADDING_H = Spacings.md;

export interface TProps {
  value: string;
  onChangeText: (text: string) => void;
  onDone: () => void;
  onClear?: () => void;
  onCancel?: () => void;
  inputLabel?: string;
  placeholder?: string;
  title?: string | ReactNode;
  subtitle?: string | ReactNode;
  ctaButton?: string | ReactNode;
  disabled?: boolean;
  ctaDisabled?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  footerStyle?: ViewStyle;
}

export function SingleInputForm(props: TProps) {
  const {
    value,
    placeholder,
    inputLabel,
    onChangeText,
    onDone,
    onClear,
    onCancel,
    title,
    subtitle,
    ctaButton = 'Done',
    disabled,
    ctaDisabled = false,
    style,
    contentStyle,
    footerStyle,
  } = props;

  function onSubmit() {
    console.log('submit');
  }

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.content, contentStyle]}>
        {title !== undefined && (
          <TextBold color={Colors.PRIMARY_EXTRA_DARK} size="lg">
            {title}
          </TextBold>
        )}

        {subtitle !== undefined && (
          <View>
            {typeof subtitle === 'string' ? (
              <TextRegular color={Colors.PRIMARY_EXTRA_DARK} size="md">
                {subtitle}
              </TextRegular>
            ) : (
              subtitle
            )}
          </View>
        )}

        <BasicInput
          mt="sm"
          label={inputLabel}
          placeholder={placeholder}
          value={value}
          onDelete={onClear}
          onChangeText={onChangeText}
        />
      </View>

      <View style={[styles.footer, footerStyle]}>
        <Button
          fontSize="sm"
          size="full"
          height="lg"
          variant="primary"
          accessibilityHint="submit the form"
          title={'hello'}
          onPress={onSubmit}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Spacings.md,
  },
  content: {
    paddingHorizontal: DEFAULT_PADDING_H,
  },
  footer: {
    paddingHorizontal: DEFAULT_PADDING_H,
    paddingTop: Spacings.sm,
    paddingBottom: Spacings.md,
    marginTop: 'auto',
    width: '100%',
    backgroundColor: 'white',

    // box shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
});
