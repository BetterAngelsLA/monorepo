import { Colors, FontSizes, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import {
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface IBasicTextareaProps extends TextInputProps {
  label?: string;
  height?: 200;
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
}

export function BasicTextarea(props: IBasicTextareaProps) {
  const {
    label,
    error,
    required,
    disabled,
    componentStyle,
    height = 200,
    mb,
    mt,
    my,
    mx,
    ml,
    mr,
    icon,
    value,
    onDelete,
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
          },
        ]}
      >
        {icon && icon}
        <TextInput
          multiline
          style={{
            color: disabled ? Colors.NEUTRAL_LIGHT : Colors.PRIMARY_EXTRA_DARK,
            paddingLeft: icon ? Spacings.xs : Spacings.sm,
            paddingRight: 38,
            flex: 1,
            fontFamily: 'Poppins-Regular',
            fontSize: 16,
            height,
            ...Platform.select({
              web: {
                outline: 'none',
              },
            }),
          }}
          editable={!disabled}
          {...rest}
          value={value}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inputBasicContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: 600,
  },
  inputBasic: {
    position: 'relative',
    fontFamily: 'Poppins-Regular',
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
    borderRadius: 8,
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
  icon: {
    position: 'absolute',
    right: 16,
    height: 16,
    width: 16,
    backgroundColor: Colors.NEUTRAL_LIGHT,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
