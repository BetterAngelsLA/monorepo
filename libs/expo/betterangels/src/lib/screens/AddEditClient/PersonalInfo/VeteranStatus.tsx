import { Spacings } from '@monorepo/expo/shared/static';
import {
  CardWrapper,
  Radio,
  TextBold,
} from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';

import { useFormContext } from 'react-hook-form';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
  VeteranStatusEnum,
} from '../../../apollo';
import { enumDisplayVeteranStatus } from '../../../static/enumDisplayMapping';

export default function VeteranStatus() {
  const { setValue, watch } = useFormContext<
    UpdateClientProfileInput | CreateClientProfileInput
  >();

  const tempVeteranStatus = watch('tempVeteranStatus');

  const onReset = () => {
    setValue('tempVeteranStatus', null);
  };
  return (
    <CardWrapper onReset={onReset} title="Veteran Status">
      <View style={styles.container}>
        <TextBold size="sm">Are you a veteran?</TextBold>
        {Object.entries(enumDisplayVeteranStatus).map(
          ([enumValue, displayValue]) => (
            <Radio
              key={enumValue}
              value={
                enumDisplayVeteranStatus[tempVeteranStatus as VeteranStatusEnum]
              }
              label={displayValue}
              onPress={() =>
                setValue('tempVeteranStatus', enumValue as VeteranStatusEnum)
              }
              accessibilityHint="selects veteran status"
            />
          )
        )}
      </View>
    </CardWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacings.xs,
  },
});
