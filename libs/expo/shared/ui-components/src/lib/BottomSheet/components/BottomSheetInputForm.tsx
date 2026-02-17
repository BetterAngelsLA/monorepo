import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Button from '../../Button';
import TextBold from '../../TextBold';
import TextRegular from '../../TextRegular';
import { BottomSheetBasicInput } from './BottomSheetBasicInput';

const DEFAULT_PADDING_H = Spacings.md;

export interface TBottomSheetInputFormProps {
  value: string;
  onChangeText: (text: string) => void;
  onDone: () => void;
  onClear?: () => void;
  inputLabel?: string;
  inputPlaceholder?: string;
  title?: string;
  subtitle?: string;
  headerSlot?: ReactNode;
  ctaButtonText?: string;
  disabled?: boolean;
  ctaDisabled?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  footerStyle?: ViewStyle;
}

export function BottomSheetInputForm(props: TBottomSheetInputFormProps) {
  const {
    value,
    inputPlaceholder,
    inputLabel,
    onChangeText,
    onDone,
    onClear,
    title,
    subtitle,
    headerSlot,
    ctaButtonText = 'Done',
    disabled,
    ctaDisabled,
    style,
    contentStyle,
    footerStyle,
  } = props;

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.content, contentStyle]}>
        {title && (
          <TextBold color={Colors.PRIMARY_EXTRA_DARK} size="lg">
            {title}
          </TextBold>
        )}

        {subtitle && (
          <TextRegular color={Colors.PRIMARY_EXTRA_DARK} size="md">
            {subtitle}
          </TextRegular>
        )}

        {!!headerSlot && headerSlot}

        <BottomSheetBasicInput
          mt="sm"
          label={inputLabel}
          placeholder={inputPlaceholder}
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
          title={ctaButtonText}
          onPress={onDone}
          disabled={ctaDisabled || disabled}
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
    marginTop: Spacings.xl,
    paddingHorizontal: DEFAULT_PADDING_H,
    paddingTop: Spacings.sm,
    paddingBottom: Spacings.md,
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
