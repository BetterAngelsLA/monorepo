import { PlusIcon } from '@monorepo/expo/shared/icons';
import {
  Colors,
  FontSizes,
  Radiuses,
  Spacings,
} from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import {
  Platform,
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
  height?: 40 | 44 | 56 | 200; // single-line heights + tall variant
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
  icon?: ReactNode;
  onDelete?: () => void;
  borderRadius?: number;
}

export function BasicInput({
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
}: IBasicInputProps) {
  const isControlled = value !== undefined;

  return (
    <View
      style={[
        styles.container,
        componentStyle,
        {
          marginBottom: mb && Spacings[mb],
          marginTop: mt && Spacings[mt],
          marginLeft: ml && Spacings[ml],
          marginRight: mr && Spacings[mr],
          marginHorizontal: mx && Spacings[mx],
          marginVertical: my && Spacings[my],
        },
      ]}
    >
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
            height, // the row owns the height
            paddingLeft: Spacings.sm,
            borderColor: error ? Colors.ERROR : Colors.NEUTRAL_LIGHT,
            borderRadius,
          },
        ]}
      >
        {icon}

        <TextInput
          // Single-line input – this helps Android treat textAlignVertical correctly
          multiline={false}
          style={[
            styles.input,
            {
              color: disabled
                ? Colors.NEUTRAL_LIGHT
                : Colors.PRIMARY_EXTRA_DARK,
              paddingRight: onDelete ? 38 : Spacings.sm,
            },
            Platform.OS === 'android' && {
              height: '100%', // <-- REQUIRED for Android vertical centering
              textAlignVertical: 'center',
              includeFontPadding: false,
            },
          ]}
          editable={!disabled}
          autoCorrect={autoCorrect}
          placeholderTextColor={Colors.NEUTRAL_LIGHT}
          // Allow placeholder/defaultValue/etc from callers
          {...rest}
          // Only control the value if actually provided (keeps defaultValue working)
          {...(isControlled ? { value } : {})}
        />

        {!!value && !!onDelete && (
          <Pressable
            accessible
            accessibilityRole="button"
            accessibilityLabel="delete icon"
            accessibilityHint="deletes input's value"
            onPress={onDelete}
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
    flexDirection: 'row',
    alignItems: 'center', // centers the (short) iOS input within the tall row
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
    position: 'relative',
  },

  input: {
    flex: 1,
    paddingVertical: 0, // remove extra vertical padding so centering is true
    paddingLeft: Spacings.xs,
    fontFamily: 'Poppins-Regular',
    fontSize: FontSizes.md.fontSize,
    // no height on iOS; it will size to its text metrics naturally
  },

  clearBtn: {
    position: 'absolute',
    right: Spacings.xs,
    height: Spacings.lg,
    width: Spacings.lg,
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
