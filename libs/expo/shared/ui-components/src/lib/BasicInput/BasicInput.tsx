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

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface IBasicInputProps extends TextInputProps {
  label?: string;
  height?: 40 | 44 | 56 | 200;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
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

export function BasicInput(props: IBasicInputProps) {
  const {
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
    ...rest
  } = props;

  return (
    <View
      style={[
        styles.inputBasicContainer,
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
        <View style={styles.label}>
          <Text style={styles.labelText}>{label}</Text>
          {required && <Text style={styles.required}>*</Text>}
        </View>
      )}
      <View
        style={[
          styles.inputBasic,
          {
            borderColor: error ? 'red' : Colors.NEUTRAL_LIGHT,
            borderRadius,
          },
        ]}
      >
        {icon && icon}
        <TextInput
          style={{
            color: disabled ? Colors.NEUTRAL_LIGHT : Colors.PRIMARY_EXTRA_DARK,
            paddingLeft: icon ? Spacings.xs : Spacings.sm,
            paddingRight: onDelete ? 38 : Spacings.sm,
            flex: 1,
            fontFamily: 'Poppins-Regular',
            fontSize: FontSizes.md.fontSize,
            height,
            ...Platform.select({
              web: {
                outline: 'none',
              },
            }),
          }}
          editable={!disabled}
          autoCorrect={autoCorrect}
          {...rest}
          value={value}
        />
        {value && onDelete && (
          <Pressable
            accessible
            accessibilityRole="button"
            accessibilityLabel="delete icon"
            accessibilityHint="deletes input's value"
            onPress={onDelete}
            style={styles.pressable}
          >
            <View style={styles.icon}>
              <PlusIcon size="xs" rotate="45deg" />
            </View>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inputBasicContainer: {
    position: 'relative',
    width: '100%',
  },
  inputBasic: {
    position: 'relative',
    fontFamily: 'Poppins-Regular',
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
    alignItems: 'center',
    flexDirection: 'row',
  },
  label: {
    flexDirection: 'row',
    marginBottom: Spacings.xs,
  },
  labelText: {
    fontSize: FontSizes.sm.fontSize,
    lineHeight: FontSizes.sm.lineHeight,
    color: Colors.PRIMARY_EXTRA_DARK,
    textTransform: 'capitalize',
    fontFamily: 'Poppins-Regular',
  },
  required: {
    marginLeft: 2,
    color: 'red',
  },
  pressable: {
    position: 'absolute',
    right: Spacings.xs,
    height: Spacings.lg,
    width: Spacings.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    height: Spacings.sm,
    width: Spacings.sm,
    backgroundColor: Colors.NEUTRAL_LIGHT,
    borderRadius: Radiuses.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
