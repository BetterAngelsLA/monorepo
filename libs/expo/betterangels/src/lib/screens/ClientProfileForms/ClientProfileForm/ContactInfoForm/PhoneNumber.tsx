import { TrashCanOutlineIcon } from '@monorepo/expo/shared/icons';
import { Colors, Regex, Spacings } from '@monorepo/expo/shared/static';
import {
  Form,
  PhoneNumberInput,
  TextButton,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { Platform, Pressable, Switch, View } from 'react-native';
import { UpdateClientProfileInput } from '../../../../apollo';

export function PhoneNumber() {
  const { control, setValue } = useFormContext<UpdateClientProfileInput>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'phoneNumbers',
  });

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
                  label={'Phone Number'}
                  name={`phoneNumbers.${index}.number`}
                  control={control}
                  rules={{
                    validate: (value: string) => {
                      // empty value is valid as it'll delete entry
                      if (!value) {
                        return true;
                      }

                      if (!Regex.phoneNumberWithExtensionUS.test(value)) {
                        return 'Enter a valid 10-digit phone number with optional extension number';
                      }

                      return true;
                    },
                  }}
                />
              </View>
              {index !== 0 && (
                <Pressable
                  style={{
                    marginTop: Spacings.md,
                    marginHorizontal: Spacings.xxs,
                  }}
                  accessible
                  accessibilityHint="closes the modal"
                  accessibilityRole="button"
                  accessibilityLabel="close"
                  onPress={() => remove(index)}
                >
                  <TrashCanOutlineIcon
                    size="md"
                    color={Colors.PRIMARY_EXTRA_DARK}
                  />
                </Pressable>
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
