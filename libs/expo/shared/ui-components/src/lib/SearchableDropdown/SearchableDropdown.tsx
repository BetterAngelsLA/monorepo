import { XmarkIcon } from '@monorepo/expo/shared/icons';
import { colors } from '@monorepo/expo/shared/static';
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
        closeOnBlur={true}
        closeOnSubmit={false}
        suggestionsListMaxHeight={256}
        renderItem={(item) => renderItem(item)}
        ItemSeparatorComponent={<></>}
        containerStyle={{ width: '100%' }}
        suggestionsListContainerStyle={styles.suggested}
        inputContainerStyle={styles.container}
        textInputProps={{
          placeholder,
          placeholderTextColor: colors.darkGray,
          style: {
            fontFamily: 'Pragmatica-book',
            fontSize: 16,
            color: colors.darkBlue,
          },
        }}
        showChevron={false}
        ClearIconComponent={
          <View style={styles.removeIcon}>
            <XmarkIcon color={colors.darkBlue} size="xs" />
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
    borderColor: colors.lightGray,
    borderWidth: 1,
    borderRadius: 3,
    backgroundColor: colors.white,
  },
  removeIcon: {
    height: 16,
    width: 16,
    backgroundColor: colors.lightGray,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggested: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 3,
    borderColor: colors.lightGray,
    elevation: 0,
    shadowOpacity: 0,
  },
});
