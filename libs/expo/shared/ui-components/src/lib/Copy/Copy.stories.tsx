import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { Alert, View } from 'react-native';
import { Copy } from './Copy';

const CopyMeta: ComponentMeta<typeof Copy> = {
  title: 'Copy',
  component: Copy,
  args: {
    textToCopy: 'Test Text',
    closeCopy: () => Alert.alert('Copied'),
  },
  decorators: [
    (Story) => (
      <View style={{ padding: 16 }}>
        <Story />
      </View>
    ),
  ],
};

export default CopyMeta;

type CopyStory = ComponentStory<typeof Copy>;

export const Basic: CopyStory = (args) => <Copy {...args} />;
