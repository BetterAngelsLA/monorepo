import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Checkbox,
  Form,
  MultiSelect,
  PreferrredCommunicationIcon,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import {
  PreferredCommunicationEnum,
  UpdateClientProfileInput,
} from '../../../../apollo';
import { enumDisplayPreferredCommunication } from '../../../../static';

type TOption = { id: PreferredCommunicationEnum; label: string };

const options: TOption[] = (
  Object.entries(enumDisplayPreferredCommunication) as [
    PreferredCommunicationEnum,
    string
  ][]
).map(([enumValue, displayValue]) => ({
  id: enumValue,
  label: displayValue,
}));

export default function PreferredCommunication() {
  const { setValue, watch } = useFormContext<UpdateClientProfileInput>();

  const selectedCommunications = watch('preferredCommunication') || [];

  return (
    <Form.Field style={{ gap: Spacings.sm }} title="Preferred Communication">
      <MultiSelect<TOption>
        onChange={(selected) => {
          const selectedEnums = selected.map((item) => item.id);

          setValue('preferredCommunication', selectedEnums);
        }}
        options={options}
        selected={selectedCommunications.map((item) => ({
          id: item,
          label: enumDisplayPreferredCommunication[item],
        }))}
        valueKey="id"
        labelKey="label"
        renderOption={(
          option,
          { isChecked, onClick, accessibilityHint, testId }
        ) => (
          <Checkbox
            key={option.id}
            isChecked={!!isChecked}
            onCheck={onClick}
            size="sm"
            hasBorder
            accessibilityHint={accessibilityHint || ''}
            testId={testId}
            label={
              <View style={styles.checkboxLabel}>
                <PreferrredCommunicationIcon
                  type={option.id}
                  color={Colors.PRIMARY_EXTRA_DARK}
                  size="md"
                />
                <TextRegular>{option.label}</TextRegular>
              </View>
            }
          />
        )}
      />
    </Form.Field>
  );
}

const styles = StyleSheet.create({
  checkboxLabel: {
    display: 'flex',
    flexDirection: 'row',
    gap: Spacings.xxs,
    alignItems: 'center',
  },
});
