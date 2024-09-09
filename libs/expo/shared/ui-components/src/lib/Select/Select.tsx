import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { StyleSheet, View, ViewStyle } from 'react-native';
import SelectDropdown from 'react-native-select-dropdown';

import { ChevronLeftIcon } from '@monorepo/expo/shared/icons';
import TextRegular from '../TextRegular';

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ISelectProps {
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
  label?: string;
  placeholder?: string;
  onValueChange: (value: string) => void;
  items: { displayValue: string; value?: string }[];
  defaultValue?: string;
}

export function Select(props: ISelectProps) {
  const {
    items,
    mb,
    mt,
    mr,
    ml,
    my,
    mx,
    label,
    onValueChange,
    placeholder = '',
    defaultValue,
  } = props;

  const containerStyle: ViewStyle = {
    width: '100%',
  };

  const selectedItem = items.find((item) => item.value === defaultValue);

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
      <SelectDropdown
        defaultValue={selectedItem}
        data={items}
        onSelect={(selectedItem, index) => {
          onValueChange(selectedItem.value);
        }}
        renderButton={(selectedItem, isOpened) => {
          return (
            <View style={styles.select}>
              <TextRegular textTransform="capitalize">
                {(selectedItem && selectedItem.displayValue) || placeholder}
              </TextRegular>
              <ChevronLeftIcon
                size="sm"
                rotate={isOpened ? '90deg' : '-90deg'}
              />
            </View>
          );
        }}
        renderItem={(item, index, isSelected) => {
          return (
            <View
              style={{
                ...styles.dropdownItemStyle,
                ...(isSelected && { backgroundColor: '#D2D9DF' }),
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: Colors.NEUTRAL_LIGHT,
              }}
            >
              <TextRegular textTransform="capitalize" size="sm">
                {item.displayValue}
              </TextRegular>
            </View>
          );
        }}
        showsVerticalScrollIndicator={false}
        dropdownStyle={styles.dropdownMenuStyle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
    borderRadius: Radiuses.xs,
    borderColor: Colors.NEUTRAL_LIGHT,
    paddingHorizontal: Spacings.sm,

    height: 56,
  },

  dropdownMenuStyle: {
    backgroundColor: '#E9ECEF',
    borderRadius: Radiuses.xs,
  },
  dropdownItemStyle: {
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 12,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingVertical: Spacings.xs,
  },
});
