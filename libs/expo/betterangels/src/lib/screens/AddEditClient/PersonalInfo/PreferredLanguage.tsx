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
  LanguageEnum,
  UpdateClientProfileInput,
} from '../../../apollo';
import { enumDisplayLanguage } from '../../../static/enumDisplayMapping';

export default function PreferredLanguage() {
  const { setValue, watch } = useFormContext<
    UpdateClientProfileInput | CreateClientProfileInput
  >();

  const preferredLanguage = watch('preferredLanguage');

  const onReset = () => {
    setValue('preferredLanguage', null);
  };
  return (
    <CardWrapper onReset={onReset} title="Preferred Language">
      <View style={styles.container}>
        <TextBold size="sm">Select Language</TextBold>
        {Object.entries(enumDisplayLanguage).map(
          ([enumValue, displayValue]) => (
            <Radio
              key={enumValue}
              value={enumDisplayLanguage[preferredLanguage as LanguageEnum]}
              label={displayValue}
              onPress={() =>
                setValue('preferredLanguage', enumValue as LanguageEnum)
              }
              accessibilityHint="selects preferred language"
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
