import { Key } from 'react';
import { View } from 'react-native';
import Checkbox from '../Checkbox';
import TextRegular from '../TextRegular';

const items = [
  { id: '1', value: 'Me' },
  { id: '2', value: 'All Authors' },
  { id: '3', value: 'Steve Young' },
  { id: '4', value: 'Alex Smith' },
  { id: '5', value: 'Joe Montana' },
  { id: '6', value: 'Jimmy Garrapolo' },
  { id: '7', value: 'Brock Purdy' },
];

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface IProps<T> {
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
  label: string;
  placeholder?: string;

  defaultValue?: string;
  labelMarginLeft?: TSpacing;
  boldLabel?: boolean;

  //   items?: { displayValue: string; value?: string }[];
  //   items: (string | T)[];
  options: T[];
  valueKey: keyof T;
  displayKey: keyof T;

  //   selected?: (string | T)[];
  selected?: T[];

  onChange: (values: T[]) => void;

  //   setSelectedItems?: React.Dispatch<React.SetStateAction<string[]>>;
  //   onSelect: (selected: []) => void;
}

// selectedItems={selectedItems}
// selectText="Pick Items"
// searchInputPlaceholderText="Search Items..."
// onChangeInput={ (text)=> console.log(text)}

export function MultiSelect<T>(props: IProps<T>) {
  const {
    label,
    options,
    valueKey,
    displayKey,
    onChange,
    selected = [],
  } = props;

  console.log();
  console.log('| -------------  MultiSelect  ------------- |');
  //   console.log(items);
  //   console.log();
  console.log();
  console.log('| -------------  selected  ------------- |');
  console.log(selected);
  console.log();

  const handleSelect = (item: T) => {
    console.log('***************** ON SELECT - item:', item);

    const selectedIdx = selected.findIndex((selectedItem) => {
      return item[valueKey] === selectedItem[valueKey];
    });

    // remove
    if (selectedIdx > -1) {
      const updated = selected.filter((selectedItem) => {
        return item[valueKey] !== selectedItem[valueKey];
      });

      return onChange(updated);
    }

    // add
    if (selectedIdx < 0) {
      return onChange([...selected, item]);
    }
  };

  return (
    <View>
      {options.map((option, index) => {
        return (
          <Checkbox
            key={option[valueKey] as Key}
            mt={index !== 0 ? 'xs' : undefined}
            isChecked={
              !!selected.find((i) => i[displayKey] === option[displayKey])
            }
            onCheck={() => handleSelect(option)}
            size="sm"
            hasBorder
            label={
              <TextRegular>{(option as T)[displayKey] as string}</TextRegular>
            }
            accessibilityHint="hello"
          />
        );
      })}
    </View>
  );
}

// return (
//     <View ref={addressViewRef}>
//       <AutocompleteInput<TPlacesPrediction>
//         value={value || ''}
//         placeholder={placeholder}
//         label={label}
//         predictions={predictions}
//         onChangeText={handleChange}
//         onFocus={handleFocus}
//         onBlur={onBlur}
//         onReset={() => onChange('')}
//         errorMessage={error?.message}
//         renderItem={(item) => (
//           <AddressOption
//             key={item.place_id}
//             item={item}
//             onPress={async () => {
//               setPredictions([]);

//               const detailAddress = await getDetailAddress(item, baseUrl);

//               onChange(detailAddress);
//             }}
//           />
//         )}
//       />
//     </View>
//   );
