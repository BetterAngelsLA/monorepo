import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { View } from 'react-native';
import { SearchableDropdown } from './SearchableDropdown';

const SearchableDropdownMeta: ComponentMeta<typeof SearchableDropdown> = {
  title: 'SearchableDropdown',
  component: SearchableDropdown,
  decorators: [
    (Story) => {
      return (
        <View style={{ padding: 16 }}>
          <View style={{ padding: 16 }}>
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
  return (
    <SearchableDropdown
      label="Label"
      setSelectedItem={(item) => console.log(item)}
      placeholder="Placeholder"
    />
  );
};
