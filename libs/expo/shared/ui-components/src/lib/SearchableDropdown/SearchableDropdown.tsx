import { XmarkIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { ReactElement, ReactNode, memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AutocompleteDropdown,
  TAutocompleteDropdownItem,
} from 'react-native-autocomplete-dropdown';
import BodyText from '../BodyText';

interface ISearchableDropdownProps {
  placeholder?: string;
  setSelectedItem: (item: TAutocompleteDropdownItem) => void;
  label: string;
  extraItem?: ReactNode;
  data: {
    id: string;
    title: string;
  }[];
}

export const SearchableDropdown = memo((props: ISearchableDropdownProps) => {
  const { placeholder, setSelectedItem, label, data, extraItem } = props;

  const renderItem = (item: { title: string | null }) => {
    if (item.title === 'extraItem') {
      return extraItem as ReactElement;
    }

    return (
      <BodyText px={16} py={16}>
        {item.title}
      </BodyText>
    );
  };

  const dataWithExtraItem = useMemo(() => {
    if (extraItem) {
      return [...data, { id: 'extraItem', title: 'extraItem' }];
    }
    return data;
  }, [extraItem, data]);

  return (
    <View>
      {label && (
        <BodyText mb={8} size="sm">
          {label}
        </BodyText>
      )}
      <AutocompleteDropdown
        clearOnFocus={false}
        closeOnBlur={false}
        closeOnSubmit={false}
        suggestionsListMaxHeight={256}
        renderItem={(item) => renderItem(item)}
        ItemSeparatorComponent={<></>}
        containerStyle={{ width: '100%' }}
        suggestionsListContainerStyle={styles.suggested}
        inputContainerStyle={styles.container}
        textInputProps={{
          placeholder,
          placeholderTextColor: Colors.DARK_GRAY,
          style: {
            fontFamily: 'Pragmatica-book',
            fontSize: 16,
            color: Colors.DARK_BLUE,
          },
        }}
        showChevron={false}
        ClearIconComponent={
          <View style={styles.removeIcon}>
            <XmarkIcon color={Colors.DARK_BLUE} size="xs" />
          </View>
        }
        onSelectItem={(e) => {
          setSelectedItem(e);
        }}
        dataSet={dataWithExtraItem}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: Colors.LIGHT_GRAY,
    borderWidth: 1,
    borderRadius: 3,
    backgroundColor: Colors.WHITE,
  },
  removeIcon: {
    height: 16,
    width: 16,
    backgroundColor: Colors.LIGHT_GRAY,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggested: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 3,
    borderColor: Colors.LIGHT_GRAY,
    elevation: 0,
    shadowOpacity: 0,
  },
});
