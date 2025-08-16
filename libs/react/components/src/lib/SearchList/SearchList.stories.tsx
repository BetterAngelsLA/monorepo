import { SbkPanel, disableControls } from '@monorepo/storybook-web';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  SearchList as StoryComponent,
  TProps as TSearchListProps,
} from './SearchList';

const colors: string[] = [
  'red',
  'blue',
  'green',
  'orange',
  'purple',
  'pink',
  'yellow',
  'brown',
  'black',
  'white',
  'gray',
  'cyan',
  'magenta',
  'lime',
  'teal',
];

const meta: Meta<typeof StoryComponent> = {
  component: StoryComponent,
  title: 'Components/Form-Ui/SearchList',
  argTypes: {
    ...disableControls(['onChange', 'className', 'value']),
  },
};

export default meta;

type Story = StoryObj<typeof StoryComponent>;

export const SearchList: Story = {
  render: (args) => {
    const [results, setResults] = useState<string[]>([]);

    const finalArgs: TSearchListProps<string> = {
      ...args,
      data: colors.map((c) => {
        return { text: c, value: c };
      }),
      onChange: setResults,
    };

    return (
      <SbkPanel variant="bordered" className="w-[400px] flex-col">
        <StoryComponent {...finalArgs} />

        <div className="mt-4 text-sm flex flex-col">
          <div>Colors Found:</div>

          <div className="mt-4 flex flex-col gap-2">
            {results.map((r) => {
              return <div>{r}</div>;
            })}

            {!results.length && (
              <div className="px-4 py-2 bg-gray-100 rounded">
                No results found
              </div>
            )}
          </div>
        </div>
      </SbkPanel>
    );
  },
};
