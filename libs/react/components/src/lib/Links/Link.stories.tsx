import { GlobeIcon } from '@monorepo/react/icons';
import { disableControls } from '@monorepo/react/storybook';
import type { Meta, StoryObj } from '@storybook/react';
import { Link } from './Link';
import { TLink } from './types';

const meta: Meta<typeof Link> = {
  title: 'Links/Link',
  component: Link,
  argTypes: disableControls(['icon']),
};

export default meta;

type Story = StoryObj<typeof Link>;

const defaultArgs: TLink = {
  href: 'https://betterangels.org',
  label: 'Better Angels',
};

const canvasClassName = 'flex-col items-start';

export const DefaultLink: Story = {
  args: { ...defaultArgs },
  parameters: { customLayout: { canvasClassName } },
  render: (args) => <Link {...args} />,
};

export const WithoutLabel: Story = {
  args: { ...defaultArgs, label: null },
  parameters: { customLayout: { canvasClassName } },
  render: (args) => <Link {...args} />,
};

export const WithDefaultIcon: Story = {
  args: { ...defaultArgs, icon: true },
  parameters: { customLayout: { canvasClassName } },
  render: (args) => <Link {...args} />,
};

export const IconBefore: Story = {
  args: { ...defaultArgs, icon: true, iconPosition: 'before' },
  parameters: { customLayout: { canvasClassName } },
  render: (args) => <Link {...args} />,
};

export const External: Story = {
  args: { ...defaultArgs, icon: true, openExternal: true },
  parameters: { customLayout: { canvasClassName } },
  render: (args) => <Link {...args} />,
};

export const Email: Story = {
  args: {
    ...defaultArgs,
    type: 'email',
    href: 'hello@betterangels.org',
    label: 'hello@betterangels.org',
    icon: true,
  },
  parameters: { customLayout: { canvasClassName } },
  render: (args) => <Link {...args} />,
};

export const Phone: Story = {
  args: {
    ...defaultArgs,
    type: 'tel',
    href: '+13105551234',
    label: '(310) 555-1234',
    icon: true,
  },
  parameters: { customLayout: { canvasClassName } },
  render: (args) => <Link {...args} />,
};

export const CustomIcon: Story = {
  args: {
    ...defaultArgs,
    label: 'betterangels.org',
    icon: <GlobeIcon className="h-3 w-3" />,
  },
  parameters: { customLayout: { canvasClassName } },
  render: (args) => <Link {...args} />,
};

export const States: Story = {
  args: { ...defaultArgs },
  parameters: { customLayout: { canvasClassName } },
  render: (args) => (
    <>
      <Link {...args} />
      <Link {...args} className="pseudo-hover" />
      <Link {...args} className="pseudo-active" />
    </>
  ),
};
