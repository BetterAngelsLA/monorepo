import { Spacings } from '@monorepo/expo/shared/static';
import {
  CardWrapper,
  Radio,
  TextBold,
} from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import {
  CreateClientProfileInput,
  LivingSituationEnum,
  UpdateClientProfileInput,
} from '../../../apollo';
import { enumDisplayLivingSituation } from '../../../static/enumDisplayMapping';

export default function LivingSituation() {
  const { setValue, watch } = useFormContext<
    UpdateClientProfileInput | CreateClientProfileInput
  >();

  const livingSituation = watch('livingSituation');

  const onReset = () => {
    setValue('livingSituation', null);
  };
  return (
    <CardWrapper onReset={onReset} title="Living Situation">
      <View style={styles.container}>
        <TextBold size="sm">Select the type of living situation</TextBold>
        {Object.entries(enumDisplayLivingSituation).map(
          ([enumValue, displayValue]) => (
            <Radio
              key={enumValue}
              value={
                enumDisplayLivingSituation[
                  livingSituation as LivingSituationEnum
                ]
              }
              label={displayValue}
              onPress={() =>
                setValue('livingSituation', enumValue as LivingSituationEnum)
              }
              accessibilityHint="selects living situation"
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
