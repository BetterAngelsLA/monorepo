import { Colors, Regex, Spacings } from '@monorepo/expo/shared/static';
import {
  CardWrapper,
  Input,
  TextBold,
  TextButton,
} from '@monorepo/expo/shared/ui-components';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { Platform, Switch, View } from 'react-native';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
} from '../../../apollo';

export default function PhoneNumbers() {
  const {
    control,
    setValue,
    formState: { errors },
  } = useFormContext<UpdateClientProfileInput | CreateClientProfileInput>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'phoneNumbers',
  });

  return (
    <CardWrapper title="Phone Numbers">
      <View style={{ gap: Spacings.xs }}>
        {fields.map((field, index) => (
          <View key={field.id}>
            <Input
              mb="xs"
              key={field.id}
              name={`phoneNumbers.${index}.number`}
              control={control}
              keyboardType="number-pad"
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
            />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacings.xs,
              }}
            >
              <TextBold size="sm">Is this phone number primary?</TextBold>
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
            {index !== 0 && (
              <View style={{ alignItems: 'flex-end' }}>
                <TextButton
                  mt="sm"
                  color={Colors.PRIMARY}
                  title="Remove"
                  accessibilityHint="Removes phone number"
                  onPress={() => remove(index)}
                />
              </View>
            )}
          </View>
        ))}

        <View style={{ alignItems: 'flex-start' }}>
          <TextButton
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
      </View>
    </CardWrapper>
  );
}
