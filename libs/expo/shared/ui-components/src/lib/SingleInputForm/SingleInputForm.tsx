import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { StyleSheet, View } from 'react-native';

import {
  BasicInput,
  Button,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { ReactNode, isValidElement } from 'react';

export interface TProps {
  value: string;
  onChangeText: (text: string) => void;
  onDone: () => void;
  onClear: () => void;
  inputLabel?: string;
  placeholder?: string;
  title?: string | ReactNode;
  subtitle?: string | ReactNode;
  ctaButton?: string | ReactNode;
  disabled?: boolean;
  ctaDisabled?: boolean;
}

export function SingleInputForm(props: TProps) {
  const {
    value,
    placeholder,
    inputLabel,
    onChangeText,
    onDone,
    onClear,
    title,
    subtitle,
    ctaButton = 'Done',
    disabled,
    ctaDisabled = false,
  } = props;

  return (
    <View style={styles.container}>
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
        //   autoFocus
        label={inputLabel}
        placeholder={placeholder}
        value={value}
        // required
        // mt="sm"
        // errorMessage={condition ? 'file name is required' : undefined}
        onDelete={onClear}
        onChangeText={onChangeText}
      />

      <View style={styles.footer}>
        {isValidElement(ctaButton) ? (
          ctaButton
        ) : (
          <Button
            onPress={onDone}
            size="full"
            title={ctaButton as 'string'}
            accessibilityHint="select pinned location"
            variant="primary"
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // flex: 1,
  },
  footer: {
    marginTop: 'auto',
    borderWidth: 4,
    borderColor: 'blue',
    paddingVertical: Spacings.sm,
  },
});
