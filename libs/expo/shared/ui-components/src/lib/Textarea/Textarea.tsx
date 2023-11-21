import { Colors } from '@monorepo/expo/shared/static';
import { Control, Controller, ValidationValueMessage } from 'react-hook-form';
import {
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';

type TValidateFn = (
  data: unknown
) => boolean | string | Promise<boolean | string>;

type TRules = {
  required?: boolean | string | ValidationValueMessage<string>;
  min?: number | string | ValidationValueMessage<number | string>;
  max?: number | string | ValidationValueMessage<number | string>;
  maxLength?: number | string | ValidationValueMessage<number | string>;
  minLength?: number | string | ValidationValueMessage<number | string>;
  pattern?: RegExp | { value: RegExp; message: string };
  validate?:
    | TValidateFn
    | Record<string, TValidateFn>
    | { value: TValidateFn; message: string };
};

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ITextareaProps {
  label: string;
  control: Control<any>;
  height?: 200;
  name: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  rules?: TRules;
  componentStyle?: StyleProp<ViewStyle>;
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
}

const SPACING = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 40,
};

export function Textarea(props: ITextareaProps) {
  const {
    label,
    control,
    rules,
    name,
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
    ...rest
  } = props;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onBlur, onChange } }) => (
        <View
          style={[
            styles.TextareaContainer,
            componentStyle,
            {
              marginBottom: mb ? SPACING[mb] : undefined,
              marginTop: mt ? SPACING[mt] : undefined,
              marginLeft: ml ? SPACING[ml] : undefined,
              marginRight: mr ? SPACING[mr] : undefined,
              marginHorizontal: mx ? SPACING[mx] : undefined,
              marginVertical: my ? SPACING[my] : undefined,
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
              styles.Textarea,
              {
                borderColor: error ? 'red' : Colors.PRIMARY_EXTRA_DARK,
              },
            ]}
          >
            <TextInput
              style={{
                color: disabled ? Colors.NEUTRAL_LIGHT : 'black',
                paddingHorizontal: 16,
                fontFamily: 'Pragmatica-book',
                fontSize: 16,
                lineHeight: 24,
                height,
                ...Platform.select({
                  web: {
                    outline: 'none',
                  },
                }),
              }}
              multiline
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              editable={!disabled}
              {...rest}
            />
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  TextareaContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: 600,
  },
  Textarea: {
    position: 'relative',
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
    borderRadius: 3,
    justifyContent: 'center',
  },
  label: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  labelText: {
    fontSize: 14,
    color: Colors.PRIMARY_EXTRA_DARK,
    textTransform: 'capitalize',
    fontFamily: 'Pragmatica-book',
  },
  required: {
    marginLeft: 2,
    color: 'red',
  },
});
