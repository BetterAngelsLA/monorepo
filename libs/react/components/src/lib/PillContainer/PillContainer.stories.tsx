// PillContainer.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { SbList } from '../../storybook';
import {
  PillContainer as StoryComponent,
  IPillContainerProps as TStoryProps,
} from './PillContainer';

const meta: Meta<typeof StoryComponent> = {
  component: StoryComponent,
  title: 'Components/PillContainer',
};
export default meta;

type Story = StoryObj<typeof StoryComponent>;

const defaultArgs: TStoryProps = {
  data: [
    'Pill1',
    'My Pill2',
    'Hello Pill3',
    'Favorite Pill4',
    'And then Pill5',
    'Etc Pill6',
  ],
  type: 'success',
  maxVisible: 5,
};

export const PillContainer: Story = {
  render: (args) => {
    const baseArgs = { ...defaultArgs, ...args };

    return (
      <SbList variant="bordered">
        <StoryComponent {...baseArgs} />
      </SbList>
    );
  },
};
