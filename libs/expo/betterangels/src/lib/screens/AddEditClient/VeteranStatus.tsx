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
  YesNoPreferNotToSayEnum,
} from '../../apollo';
import { enumDisplayVeteran } from '../../static/enumDisplayMapping';

export default function VeteranStatus() {
  const { setValue, watch } = useFormContext<
    UpdateClientProfileInput | CreateClientProfileInput
  >();

  const veteranStatus = watch('veteranStatus');

  const onReset = () => {
    setValue('veteranStatus', null);
  };
  return (
    <CardWrapper onReset={onReset} title="Veteran Status">
      <View style={styles.container}>
        <TextBold size="sm">Are you a veteran?</TextBold>
        {Object.entries(enumDisplayVeteran).map(([enumValue, displayValue]) => (
          <Radio
            key={enumValue}
            value={enumDisplayVeteran[veteranStatus as YesNoPreferNotToSayEnum]}
            label={displayValue}
            onPress={() =>
              setValue('veteranStatus', enumValue as YesNoPreferNotToSayEnum)
            }
            accessibilityHint="selects living situation"
          />
        ))}
      </View>
    </CardWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacings.xs,
  },
});
