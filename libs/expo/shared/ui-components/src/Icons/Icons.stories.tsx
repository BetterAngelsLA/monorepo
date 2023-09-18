import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { StyleSheet, View } from 'react-native';

import * as AllIcons from '@monorepo/expo/shared/icons';

const IconsMeta: ComponentMeta<any> = {
  title: 'Icons',
  args: {
    size: 'lg',
    color: 'blue',
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
    },
  },
  decorators: [
    (Story: any) => (
      <View style={{ padding: 16 }}>
        <Story />
      </View>
    ),
  ],
};

export default IconsMeta;

type ButtonStory = ComponentStory;

export const Basic: ButtonStory = ({ size, color }: AllIcons.IIconProps) => {
  const icons = Object.values(AllIcons).filter((s) =>
    s?.displayName?.match('Icon')
  );

  return (
    <View style={styles.container}>
      {icons.map((IconComponent: any) => (
        <View style={styles.item}>
          <IconComponent size={size} color={color} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  item: {
    width: '33%',
  },
});
