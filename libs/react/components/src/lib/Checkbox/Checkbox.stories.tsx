import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { disableControls } from '../../storybook';
import { ICheckbox, Checkbox as StoryComponent } from './Checkbox';

const meta: Meta<typeof StoryComponent> = {
  title: 'Components/Form-Ui/Checkbox',
  component: StoryComponent,
  argTypes: {
    ...disableControls(['onChange']),
  },
};
export default meta;

type Story = StoryObj<typeof StoryComponent>;

const defaultArgs: Pick<ICheckbox, 'label'> = {
  label: 'checkbox label',
};

export const Checkbox: Story = {
  render: (args) => {
    const [checked, setChecked] = useState<boolean>(false);

    const baseArgs: ICheckbox = {
      ...defaultArgs,
      ...args,
      checked,
      onChange: setChecked,
    };

    return <StoryComponent {...baseArgs} className="w-[300px]" />;
  },
};
