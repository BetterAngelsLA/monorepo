import { disableControls } from '@monorepo/react/storybook';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  SearchInput as StoryComponent,
  TProps as TSearchProps,
} from './SearchInput';

const meta: Meta<typeof StoryComponent> = {
  component: StoryComponent,
  title: 'Form-Ui/SearchInput',
  argTypes: {
    ...disableControls(['onChange', 'className', 'value']),
  },
};

export default meta;

type Story = StoryObj<typeof StoryComponent>;

export const SearchInput: Story = {
  parameters: {
    customLayout: {
      canvasClassName: 'flex-col w-[400px]',
    },
  },
  render: (args) => {
    const [val, setVal] = useState('');

    const finalArgs: TSearchProps = {
      ...args,
      onChange: setVal,
    };

    return (
      <>
        <StoryComponent {...finalArgs} />

        <div className="mt-4 text-sm flex items-center">
          <div>Debounced:</div>

          <div className="ml-2 p-2 bg-gray-100 rounded min-h-[24px]">{val}</div>
        </div>
      </>
    );
  },
};
