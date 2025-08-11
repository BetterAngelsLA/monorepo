import type { Meta, StoryObj } from '@storybook/react';
import { SbButton, SbList, withMemoryRouter } from '../../storybook';
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
        <SbList>
          <SbButton
            className="bg-purple-400"
            onClick={() => showDrawer({ content: 'hello content' })}
          >
            Default
          </SbButton>
          <SbButton
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
          </SbButton>
          <SbButton
            className="bg-blue-400"
            onClick={() =>
              showDrawer({ content: 'hello content', placement: 'left' })
            }
          >
            From Left
          </SbButton>
        </SbList>
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
