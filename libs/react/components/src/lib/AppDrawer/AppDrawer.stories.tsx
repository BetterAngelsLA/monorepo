import { SbkButton, withMemoryRouter } from '@monorepo/react/storybook';
import type { Meta, StoryObj } from '@storybook/react';
import { AppDrawer } from './AppDrawer';
import { useAppDrawer } from './state/useAppDrawer';

const meta: Meta = {
  title: 'AppDrawer',
  decorators: [withMemoryRouter('/')],
};

export default meta;

type Story = StoryObj;

export const AppDrawerDemo: Story = {
  parameters: {
    customLayout: {
      canvasClassName: 'flex-col',
    },
  },
  render: () => {
    const Demo = () => {
      const { showDrawer } = useAppDrawer();

      return (
        <>
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
        </>
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
