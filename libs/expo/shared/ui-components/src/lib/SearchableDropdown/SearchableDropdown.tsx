import { PlusIcon, XmarkIcon } from '@monorepo/expo/shared/icons';
import { colors } from '@monorepo/expo/shared/static';
import { memo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  AutocompleteDropdown,
  TAutocompleteDropdownItem,
} from 'react-native-autocomplete-dropdown';
import BodyText from '../BodyText';

interface ISearchableDropdownProps {
  placeholder: string;
  setSelectedItem: (item: TAutocompleteDropdownItem) => void;
  label: string;
}

export const SearchableDropdown = memo((props: ISearchableDropdownProps) => {
  const { placeholder, setSelectedItem, label } = props;

  const renderItem = (item: { title: string | null }) => {
    if (item.title === 'extraItem') {
      return (
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderTopColor: colors.lightGray,
            borderTopWidth: 1,
            paddingVertical: 16,
            paddingHorizontal: 16,
          }}
          onPress={() => console.log('test')}
        >
          <PlusIcon size="md" color={colors.darkBlue} />
          <BodyText ml={8}>Create a Team</BodyText>
        </TouchableOpacity>
      );
    }
    // Return the default rendering for normal items
    return (
      <BodyText px={16} py={16}>
        {item.title}
      </BodyText>
    );
  };

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
        dataSet={[
          { id: '1', title: 'Alpha' },
          { id: '2', title: 'Beta' },
          { id: '3', title: 'Gamma' },
          { id: 'extraItem', title: 'extraItem' },
        ]}
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
    elevation: 0,
    shadowOpacity: 0,
  },
});
