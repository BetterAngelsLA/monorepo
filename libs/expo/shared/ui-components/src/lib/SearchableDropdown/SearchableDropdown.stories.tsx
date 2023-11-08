import { PlusIcon } from '@monorepo/expo/shared/icons';
import { colors } from '@monorepo/expo/shared/static';
import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { TouchableOpacity, View } from 'react-native';
import { AutocompleteDropdownContextProvider } from 'react-native-autocomplete-dropdown';
import BodyText from '../BodyText';
import { SearchableDropdown } from './SearchableDropdown';

const SearchableDropdownMeta: ComponentMeta<typeof SearchableDropdown> = {
  title: 'SearchableDropdown',
  component: SearchableDropdown,
  decorators: [
    (Story) => {
      return (
        <View style={{ padding: 16 }}>
          <View style={{ padding: 16, position: 'relative' }}>
            <Story />
          </View>
        </View>
      );
    },
  ],
};

export default SearchableDropdownMeta;

type SearchableDropdownStory = ComponentStory<typeof SearchableDropdown>;

export const Basic: SearchableDropdownStory = (args, context) => {
  const data = [
    { id: '1', title: 'Alpha' },
    { id: '2', title: 'Beta' },
    { id: '3', title: 'Gamma' },
  ];
  return (
    <AutocompleteDropdownContextProvider>
      <SearchableDropdown
        extraItem={
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
        }
        label="Label"
        setSelectedItem={(item) => console.log(item)}
        placeholder="Placeholder"
        data={data}
      />
    </AutocompleteDropdownContextProvider>
  );
};
