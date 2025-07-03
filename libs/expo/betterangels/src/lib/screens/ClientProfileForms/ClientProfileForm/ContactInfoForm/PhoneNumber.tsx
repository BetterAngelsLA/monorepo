import { Colors, Regex, Spacings } from '@monorepo/expo/shared/static';
import {
  Form,
  PhoneNumberInput,
  TextButton,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import {
  Controller,
  useFieldArray,
  useFormContext,
  useWatch,
} from 'react-hook-form';
import { Platform, Switch, View } from 'react-native';
import { UpdateClientProfileInput } from '../../../../apollo';

export function PhoneNumber() {
  const {
    control,
    setValue,
    formState: { errors },
  } = useFormContext<UpdateClientProfileInput>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'phoneNumbers',
  });

  console.log('########## CLIENT contact-info form PhoneNumber');

  const phoneNumbers = useWatch({
    control,
    name: 'phoneNumbers',
  });

  // useEffect(() => {
  //   console.log();
  //   console.log('| -------------  WATCH phoneNumbers  ------------- |');
  //   console.log(phoneNumbers);
  //   console.log();
  // }, [phoneNumbers]);

  return (
    <Form.Field title="Phone Number(s)">
      <View style={{ gap: Spacings.sm }}>
        {fields.map((field, index) => (
          <View style={{ gap: Spacings.sm }} key={field.id}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacings.xs,
              }}
            >
              <View style={{ flex: 1 }}>
                <PhoneNumberInput
                  label={'Phone Number '}
                  name={`phoneNumbers.${index}.number`}
                  control={control}
                  rules={{
                    validate: (value: string) => {
                      if (!Regex.phoneNumberWithExtensionUS.test(value)) {
                        return 'Enter a 10-digit phone number with optional extension number';
                      }

                      return true;
                    },
                  }}
                />

                {/* <PhoneNumberUncontrolled
                  // onChange={onPhoneNumberChange}
                  // onChange={onPhoneNumberChange}
                  label={'Phone Number'}
                  onChangeParts={(phone, ext) => {
                    console.log(`CHANGED PARTS: [${phone}]  [${ext}]`);
                  }}
                  // name={`phoneNumbers.${index}.number`}
                  // control={control}
                  // errors={errors.phoneNumber}
                  // onChange={(value) => setValue('phoneNumber', value)}
                  // errors={errors.phoneNumber}
                /> */}

                {/* <PhoneNumberInput
                  // onChange={onPhoneNumberChange}
                  // onChange={onPhoneNumberChange}
                  label={'Phone Number'}
                  name={`phoneNumbers.${index}.number`}
                  control={control}
                  // errors={errors.phoneNumber}
                  // onChange={(value) => setValue('phoneNumber', value)}
                  // errors={errors.phoneNumber}
                /> */}

                {/* onChangeParts={(phone, ext) => {
                    console.log(`CHANGED PARTS: [${phone}]  [${ext}]`);
                  }}
                  name={`phoneNumbers.${index}.number`}
                  control={control}
                  errors={errors.phoneNumber}
                  onChange={(value) => setValue('phoneNumber', value)}
                  errors={errors.phoneNumber} */}

                {/* <ControlledInput
                  placeholder="Enter phone number"
                  key={field.id}
                  name={`phoneNumbers.${index}.number`}
                  control={control}
                  keyboardType="number-pad"
                  onDelete={() => setValue(`phoneNumbers.${index}.number`, '')}
                  error={!!errors.phoneNumbers?.[index]?.number}
                  errorMessage={
                    (errors.phoneNumbers?.[index]?.number?.message as string) ||
                    undefined
                  }
                  rules={{
                    validate: (value: string) => {
                      if (value && !Regex.phoneNumber.test(value)) {
                        return 'Enter a 10-digit phone number without space or special characters';
                      }
                      return true;
                    },
                  }}
                /> */}
              </View>
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
            })
          }
          title="Add another phone number"
          accessibilityHint="Adds another phone number"
        />
      </View>
    </Form.Field>
  );
}
