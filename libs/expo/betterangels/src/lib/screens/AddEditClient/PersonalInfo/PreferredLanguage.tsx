import { Spacings } from '@monorepo/expo/shared/static';
import { CardWrapper, TextBold } from '@monorepo/expo/shared/ui-components';
import { Picker } from '@react-native-picker/picker';
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

  const hello = enumDisplayLanguage[LanguageEnum.Arabic];

  return (
    <CardWrapper onReset={onReset} title="Preferred Language">
      <View style={styles.container}>
        <TextBold size="sm">Select Language</TextBold>

        <Picker
          selectedValue={preferredLanguage as LanguageEnum}
          onValueChange={(itemValue: LanguageEnum, itemIndex: number) =>
            setValue('preferredLanguage', itemValue as LanguageEnum)
          }
        >
          {Object.entries(enumDisplayLanguage).map(([key, label]) => {
            return <Picker.Item label={label} value={key} key={key} />;
          })}
        </Picker>
      </View>
    </CardWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacings.xs,
  },
});
