import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Form,
  PhoneNumberInput,
  TextButton,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { Platform, Switch, View } from 'react-native';
import { UpdateClientProfileInput } from '../../../../apollo';
import { TPhoneNumber } from '../types';

type TUpdateClientContactInfoInput = Omit<
  UpdateClientProfileInput,
  'phoneNumbers'
> & {
  phoneNumbers: TPhoneNumber[];
};

export function PhoneNumber() {
  const {
    control,
    setValue,
    formState: { errors },
    clearErrors,
  } = useFormContext<TUpdateClientContactInfoInput>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'phoneNumbers',
  });
  // function onPhoneNumberChange(value) {
  //   console.log('~~~~~~~~home value');
  //   console.log(value);
  // }
  return (
    <Form.Field title="Phone Number(s)">
      <View style={{ gap: Spacings.sm }}>
        {fields.map((field, index) => (
          <View style={{ gap: Spacings.sm }} key={field.id}>
            <View style={{ gap: Spacings.xs }}>
              <PhoneNumberInput
                // onChange={onPhoneNumberChange}
                // onChange={onPhoneNumberChange}
                label={'Phone Number'}
                name={`phoneNumbers.${index}.number`}
                control={control}
                // errors={errors.phoneNumber}
                // onChange={(value) => setValue('phoneNumber', value)}
                // errors={errors.phoneNumber}
              />
              {/* <View style={{ flexDirection: 'row' }}>
                <ControlledInput
                  style={{ flex: 2, marginRight: Spacings.xs }}
                  name={`phoneNumbers.${index}.number`}
                  control={control}
                  label={'Phone Number'}
                  placeholder="Enter phone number"
                  keyboardType="number-pad"
                  onDelete={() => {
                    setValue(`phoneNumbers.${index}.number`, '');
                    clearErrors(`phoneNumbers.${index}.number`);
                  }}
                  error={!!errors.phoneNumbers?.[index]?.number}
                  rules={{
                    validate: (value: string) => {
                      if (value && !Regex.phoneNumber.test(value)) {
                        return 'Enter a 10-digit phone number without space or special characters';
                      }

                      return true;
                    },
                  }}
                />
                <ControlledInput
                  style={{ flex: 1 }}
                  name={`phoneNumbers.${index}.extension`}
                  control={control}
                  label={' '}
                  placeholder="ext"
                  keyboardType="number-pad"
                  onDelete={() => {
                    setValue(`phoneNumbers.${index}.extension`, '');
                    clearErrors(`phoneNumbers.${index}.extension`);
                  }}
                  error={!!errors.phoneNumbers?.[index]?.extension}
                  rules={{
                    validate: (value: string) => {
                      if (value && !Regex.number.test(value)) {
                        return 'Extension must be a number';
                      }

                      return true;
                    },
                  }}
                />
              </View>
              <View style={{ marginTop: -Spacings.xs }}>
                {errors.phoneNumbers?.[index]?.number && (
                  <TextRegular size={'sm'} color={Colors.ERROR}>
                    Enter a 10-digit phone number without space or special
                    characters
                  </TextRegular>
                )}
                {errors.phoneNumbers?.[index]?.extension && (
                  <TextRegular size={'sm'} color={Colors.ERROR}>
                    Extension must be a number
                  </TextRegular>
                )}
              </View> */}
              {index !== 0 && (
                <TextButton
                  color={Colors.PRIMARY}
                  title="Remove"
                  accessibilityHint="Removes phone number"
                  onPress={() => remove(index)}
                />
              )}
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacings.xs,
              }}
            >
              <TextRegular size="sm">Primary phone number?</TextRegular>
              <Controller
                control={control}
                name={`phoneNumbers.${index}.isPrimary`}
                render={({ field: { value, onChange } }) => (
                  <Switch
                    style={{
                      transform: [
                        { scaleX: Platform.OS === 'ios' ? 0.8 : 1 },
                        { scaleY: Platform.OS === 'ios' ? 0.8 : 1 },
                      ],
                    }}
                    onValueChange={(newValue) => {
                      if (newValue) {
                        fields.forEach((_, i) => {
                          if (i !== index) {
                            setValue(`phoneNumbers.${i}.isPrimary`, false);
                          }
                        });
                      }
                      onChange(newValue);
                    }}
                    value={value || false}
                  />
                )}
              />
            </View>
          </View>
        ))}
      </View>

      <View style={{ alignItems: 'flex-start', marginTop: Spacings.lg }}>
        <TextButton
          fontSize="sm"
          color={Colors.PRIMARY}
          onPress={() =>
            append({
              isPrimary: false,
              number: '',
              extension: '',
            })
          }
          title="Add another phone number"
          accessibilityHint="Adds another phone number"
        />
      </View>
    </Form.Field>
  );
}
