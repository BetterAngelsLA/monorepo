import { FlatList, TouchableOpacity } from 'react-native';
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
  items: T[];
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
  const { label, items, valueKey, displayKey, onChange, selected = [] } = props;

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

      console.log('################################### REMOVE');
      console.log(updated);

      return onChange(updated);
    }

    // add
    if (selectedIdx < 0) {
      console.log('################################### ADD');
      console.log([...selected, item]);

      return onChange([...selected, item]);
    }

    // setSelectedItems((prev) => {
    //   const itemId = valueKey ? (item as T)[valueKey] : item;
    //   if (prev.includes(String(itemId))) {
    //     return prev.filter((i) => String(i) !== String(itemId));
    //   }
    //   return [...prev, String(itemId)];
    // });
  };

  return (
    <FlatList
      data={items}
      keyExtractor={(item, index) =>
        valueKey ? String((item as T)[valueKey]) : String(index)
      }
      renderItem={({ item, index }) => (
        <TouchableOpacity onPress={() => handleSelect(item)}>
          <Checkbox
            mt={index !== 0 ? 'xs' : undefined}
            isChecked={
              !!selected.find((i) => i[displayKey] === item[displayKey])
            }
            onCheck={() => handleSelect(item)}
            size="sm"
            hasBorder
            label={
              <TextRegular>{(item as T)[displayKey] as string}</TextRegular>
            }
            accessibilityHint="hello"
          />
        </TouchableOpacity>
      )}
    />

    // label={(item as T)[displayKey] as string}
    // <View>
    //   <TextRegular>{label}</TextRegular>
    // </View>
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
