import { PlusIcon } from '@monorepo/expo/shared/icons';
import {
  Colors,
  FontSizes,
  Radiuses,
  Spacings,
} from '@monorepo/expo/shared/static';
import React, { forwardRef, useMemo } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import TextRegular from '../TextRegular';

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface IBasicInputProps extends TextInputProps {
  label?: string;
  height?: 40 | 44 | 56 | 200;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  componentStyle?: StyleProp<ViewStyle>;
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
  icon?: React.ReactNode;
  onDelete?: () => void;
  borderRadius?: number;
}

const CLEAR_TOUCH = Spacings.lg;
const CLEAR_PAD_RIGHT = Spacings.xs + CLEAR_TOUCH;

export const BasicInput = forwardRef<TextInput, IBasicInputProps>(
  function BasicInput(
    {
      label,
      error,
      required,
      disabled,
      componentStyle,
      height = 56,
      mb,
      mt,
      my,
      mx,
      ml,
      mr,
      icon,
      value,
      onDelete,
      autoCorrect = true,
      borderRadius = Radiuses.xs,
      errorMessage,
      ...rest
    },
    ref
  ) {
    const isControlled = value !== undefined;
    const color = disabled ? Colors.NEUTRAL_LIGHT : Colors.PRIMARY_EXTRA_DARK;

    // show clear only when controlled and non-empty
    const showClear =
      !!onDelete && isControlled && String(value ?? '').length > 0;

    // margins consolidated
    const margins = useMemo(
      () => ({
        marginBottom: mb && Spacings[mb],
        marginTop: mt && Spacings[mt],
        marginLeft: ml && Spacings[ml],
        marginRight: mr && Spacings[mr],
        marginHorizontal: mx && Spacings[mx],
        marginVertical: my && Spacings[my],
      }),
      [mb, mt, ml, mr, mx, my]
    );

    return (
      <View style={[styles.container, componentStyle, margins]}>
        {label && (
          <View style={styles.labelRow}>
            <Text style={styles.labelText}>{label}</Text>
            {required && <Text style={styles.required}>*</Text>}
          </View>
        )}

        <View
          style={[
            styles.row,
            {
              height,
              borderColor: error ? Colors.ERROR : Colors.NEUTRAL_LIGHT,
              borderRadius,
              paddingLeft: icon ? 0 : Spacings.sm, // avoid double left padding
            },
          ]}
        >
          {icon && <View style={styles.leftIconWrap}>{icon}</View>}

          <TextInput
            ref={ref}
            // single-line; baseline centered by the row
            multiline={false}
            numberOfLines={1}
            allowFontScaling={false}
            editable={!disabled}
            autoCorrect={autoCorrect}
            placeholderTextColor={Colors.NEUTRAL_LIGHT}
            // keep defaultValue working if not controlled
            {...rest}
            {...(isControlled
              ? {
                  value:
                    typeof value === 'string' ? value : String(value ?? ''),
                }
              : {})}
            style={[
              styles.input,
              {
                color,
                paddingLeft: icon ? Spacings.xs : 0, // when icon exists, give a small inset
                paddingRight: showClear ? CLEAR_PAD_RIGHT : Spacings.sm,
                textAlignVertical: 'center', // Android; ignored on iOS
                includeFontPadding: false, // Android; ignored on iOS
              },
            ]}
          />

          {showClear && (
            <Pressable
              accessible
              accessibilityRole="button"
              accessibilityLabel={`clear ${label || 'input'}`}
              accessibilityHint={`clears ${label || 'input'} value`}
              onPress={onDelete}
              hitSlop={8}
              style={styles.clearBtn}
            >
              <View style={styles.clearIconBg}>
                <PlusIcon size="xs" rotate="45deg" />
              </View>
            </Pressable>
          )}
        </View>

        {errorMessage && (
          <TextRegular mt="xxs" size="sm" color={Colors.ERROR}>
            {errorMessage}
          </TextRegular>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: { width: '100%' },

  labelRow: { flexDirection: 'row', marginBottom: Spacings.xs },
  labelText: {
    fontSize: FontSizes.sm.fontSize,
    lineHeight: FontSizes.sm.lineHeight,
    color: Colors.PRIMARY_EXTRA_DARK,
    textTransform: 'capitalize',
    fontFamily: 'Poppins-Regular',
  },
  required: { marginLeft: 2, color: Colors.ERROR },

  row: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
  },

  leftIconWrap: {
    height: Spacings.lg,
    width: Spacings.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacings.xs,
  },

  input: {
    flex: 1,
    paddingVertical: 0,
    fontFamily: 'Poppins-Regular',
    fontSize: FontSizes.md.fontSize,
  },

  clearBtn: {
    position: 'absolute',
    right: Spacings.xs,
    height: CLEAR_TOUCH,
    width: CLEAR_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearIconBg: {
    height: Spacings.sm,
    width: Spacings.sm,
    backgroundColor: Colors.NEUTRAL_LIGHT,
    borderRadius: Radiuses.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
