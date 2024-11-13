import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  CardWrapper,
  Input,
  Radio,
  TextBold,
  TextButton,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import {
  CreateClientProfileInput,
  HmisAgencyEnum,
  UpdateClientProfileInput,
} from '../../../apollo';
import { enumDisplayHmisAgency } from '../../../static/enumDisplayMapping';

export default function HmisProfiles() {
  const {
    setValue,
    watch,
    control,
    formState: { errors },
  } = useFormContext<UpdateClientProfileInput | CreateClientProfileInput>();

  const { fields, append } = useFieldArray({
    control,
    name: 'hmisProfiles',
  });

  const hmisProfiles = watch('hmisProfiles') || [];

  const onReset = () => {
    setValue('hmisProfiles', []);
  };

  return (
    <CardWrapper
      {...(hmisProfiles.length !== 0 && { onReset })}
      title="HMIS IDs"
      subtitle={hmisProfiles.length ? 'Fill in both HMIS ID Type and ID #' : ''}
    >
      {fields.map((_, index) => (
        <View style={{ gap: Spacings.sm }} key={index}>
          <View style={{ gap: Spacings.xs }}>
            <TextBold size="sm">Select the type of HMIS ID</TextBold>
            {Object.entries(enumDisplayHmisAgency).map(
              ([enumValue, displayValue]) => (
                <Radio
                  key={enumValue}
                  value={enumDisplayHmisAgency[hmisProfiles[index].agency]}
                  label={displayValue}
                  onPress={() => {
                    const updatedProfiles = [...hmisProfiles];
                    updatedProfiles[index] = {
                      ...updatedProfiles[index],
                      agency: enumValue as HmisAgencyEnum,
                    };
                    setValue('hmisProfiles', updatedProfiles);
                  }}
                  accessibilityHint="selects hmis id"
                />
              )
            )}
          </View>
          <View style={styles.hmisIdContainer}>
            <TextBold size="sm" mt="md">
              Enter the ID #
            </TextBold>
            <TextRegular size="sm">
              Pair your HMIS ID type with a specific ID
            </TextRegular>
            <Input
              mt="xs"
              placeholder="Enter HMIS ID"
              name={`hmisProfiles[${index}].hmisId`}
              control={control}
              error={errors.hmisProfiles && !!errors.hmisProfiles[index]}
              errorMessage={
                errors.hmisProfiles && errors.hmisProfiles[index]
                  ? 'Enter HMIS ID or remove this entry'
                  : ''
              }
              rules={{
                required: true,
              }}
            />
          </View>
        </View>
      ))}
      <View style={{ alignItems: 'flex-start' }}>
        <TextButton
          color={Colors.PRIMARY}
          onPress={() =>
            append({
              agency: HmisAgencyEnum.Lahsa,
              hmisId: '',
            })
          }
          title={fields.length < 1 ? 'Add HMIS ID' : 'Add another HMIS ID'}
          accessibilityHint="adds another hmis id"
        />
      </View>
    </CardWrapper>
  );
}

const styles = StyleSheet.create({
  hmisIdContainer: {
    flexDirection: 'column',
    gap: 0,
  },
});
