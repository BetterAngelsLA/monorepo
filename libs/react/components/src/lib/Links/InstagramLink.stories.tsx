import { disableControls } from '@monorepo/react/storybook';
import type { Meta, StoryObj } from '@storybook/react';
import { InstagramLink } from './InstagramLink';

const meta: Meta<typeof InstagramLink> = {
  title: 'Links/InstagramLink',
  component: InstagramLink,
  argTypes: disableControls(['icon', 'fallback']),
};

export default meta;

type Story = StoryObj<typeof InstagramLink>;

const canvasClassName = 'flex-col items-start';

export const HandleWithAt: Story = {
  args: {
    handleOrHref: '@betterangels',
    label: 'Follow us',
  },
  parameters: { customLayout: { canvasClassName } },
  render: (args) => <InstagramLink {...args} />,
};

export const HandleWithoutAt: Story = {
  args: {
    handleOrHref: 'betterangels',
    label: 'Follow us',
  },
  parameters: { customLayout: { canvasClassName } },
  render: (args) => <InstagramLink {...args} />,
};

export const ProfileUrl: Story = {
  args: {
    handleOrHref: 'instagram.com/betterangels',
    label: 'Follow us',
  },
  parameters: { customLayout: { canvasClassName } },
  render: (args) => <InstagramLink {...args} />,
};

export const PostUrl: Story = {
  args: {
    handleOrHref: 'https://www.instagram.com/p/Cabc123/',
    label: 'View post',
  },
  parameters: { customLayout: { canvasClassName } },
  render: (args) => <InstagramLink {...args} />,
};

export const Fallback: Story = {
  args: {
    handleOrHref: null,
    fallback: 'No Instagram',
  },
  parameters: { customLayout: { canvasClassName } },
  render: (args) => <InstagramLink {...args} />,
};
