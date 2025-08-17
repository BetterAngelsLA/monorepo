import { SbkGallery } from '@monorepo/react/storybook-web';
import type { Meta, StoryObj } from '@storybook/react';
import { ComponentType, SVGProps } from 'react';
import * as icons from '../index';

// Avoid prop collision with SVG's built-in `type` attribute
type BaseSvgProps = Omit<SVGProps<SVGSVGElement>, 'type'>;
type TIconFile = ComponentType<BaseSvgProps>;

type TIconItem = {
  name: string;
  Icon: TIconFile;
};

const iconList: TIconItem[] = Object.entries(icons).map(([key, value]) => {
  return {
    name: key,
    Icon: value,
  };
});

const meta: Meta = {
  title: 'Iconography',
  parameters: { controls: { disable: true } },
};
export default meta;

type Story = StoryObj;

export const IconComponents: Story = {
  parameters: { layout: false },
  render: () => {
    return (
      <SbkGallery
        searchable
        searchPlaceholder="search components..."
        data={iconList.map(({ name, Icon }) => {
          return {
            Item: <Icon width={24} height={24} />,
            title: name,
            searchText: name,
          };
        })}
      />
    );
  },
};
