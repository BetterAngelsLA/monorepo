import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { StyleSheet, View, ViewStyle } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import TextRegular from '../TextRegular';

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ISelectProps {
  data: string[];
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
  label?: string;
  placeholder?: string;
  onChange: (e: any) => void;
  value: string;
}

export function Select(props: ISelectProps) {
  const { value, data, mb, mt, mr, ml, my, mx, label, onChange } = props;

  const containerStyle: ViewStyle = {
    width: '100%',
    maxWidth: 600,
  };

  return (
    <View
      style={[
        containerStyle,
        {
          marginBottom: mb && Spacings[mb],
          marginTop: mt && Spacings[mt],
          marginLeft: ml && Spacings[ml],
          marginRight: mr && Spacings[mr],
          marginHorizontal: mx && Spacings[mx],
          marginVertical: my && Spacings[my],
        },
      ]}
    >
      {label && (
        <TextRegular mb="xs" size="sm">
          {label}
        </TextRegular>
      )}
      <RNPickerSelect
        useNativeAndroidPickerStyle={false}
        style={{
          inputIOSContainer: styles.select,
          inputAndroidContainer: styles.select,
        }}
        onValueChange={(value) => onChange(value)}
        value={value}
        items={data.map((item) => ({ label: item, value: item }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  select: {
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: Colors.NEUTRAL_LIGHT,
    justifyContent: 'center',
    paddingLeft: Spacings.sm,
    paddingRight: 38,
    height: 56,
  },
});
