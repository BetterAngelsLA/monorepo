import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  CardWrapper,
  Input,
  Radio,
  TextBold,
  TextButton,
} from '@monorepo/expo/shared/ui-components';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { View } from 'react-native';
import {
  CreateClientProfileInput,
  HmisAgencyEnum,
  UpdateClientProfileInput,
} from '../../../apollo';
import { enumDisplayHmisAgency } from '../../../static/enumDisplayMapping';

export default function HmisProfiles() {
  const { setValue, watch, control } = useFormContext<
    UpdateClientProfileInput | CreateClientProfileInput
  >();

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
          <Input
            placeholder="Enter HMIS ID"
            label="Enter the ID #"
            name={`hmisProfiles[${index}].hmisId`}
            control={control}
          />
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
