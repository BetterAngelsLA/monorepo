import { disableControls } from '@monorepo/storybook-web';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { CheckboxGroup as StoryComponent, TProps } from './CheckboxGroup';

const meta: Meta<typeof StoryComponent> = {
  title: 'Components/Form-Ui/Checkbox',
  component: StoryComponent,
  argTypes: {
    ...disableControls(['onClick']),
  },
};
export default meta;

type Story = StoryObj;

const defaultArgs: Pick<TProps, 'options' | 'values' | 'selectAll'> = {
  options: ['option 1', 'option 2', 'option 3'],
  values: [],
};

export const CheckboxGroup: Story = {
  render: (args) => {
    const [selected, setSelected] = useState<string[]>([]);
    const baseArgs: TProps = {
      ...defaultArgs,
      ...args,
      values: selected,
      onChange: setSelected,
    };

    return <StoryComponent {...baseArgs} className="w-80" />;
  },
};
