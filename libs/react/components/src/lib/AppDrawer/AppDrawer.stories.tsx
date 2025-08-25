import { SbkButton, withMemoryRouter } from '@monorepo/react/storybook';
import type { Meta, StoryObj } from '@storybook/react';
import { AppDrawer } from './AppDrawer';
import { useAppDrawer } from './state/useAppDrawer';

const meta: Meta = {
  title: 'Components/AppDrawer',
  decorators: [withMemoryRouter('/')],
};

export default meta;

type Story = StoryObj;

export const AppDrawerDemo: Story = {
  render: () => {
    const Demo = () => {
      const { showDrawer } = useAppDrawer();

      return (
        <div className="flex flex-col gap-8">
          <SbkButton
            className="bg-purple-400"
            onClick={() => showDrawer({ content: 'hello content' })}
          >
            Default
          </SbkButton>
          <SbkButton
            className="bg-purple-400"
            onClick={() =>
              showDrawer({
                content: 'hello content',
                header: 'Drawer Header',
                footer: 'Drawer Footer',
              })
            }
          >
            with Header/Footer
          </SbkButton>
          <SbkButton
            className="bg-blue-400"
            onClick={() =>
              showDrawer({ content: 'hello content', placement: 'left' })
            }
          >
            From Left
          </SbkButton>
        </div>
      );
    };

    return (
      <>
        <Demo />
        <AppDrawer />
      </>
    );
  },
};
