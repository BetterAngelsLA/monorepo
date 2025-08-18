import { SbkButton, SbkPanel } from '@monorepo/react/storybook';
import type { Meta, StoryObj } from '@storybook/react';
import { Alert } from './Alert';
import { useAlert } from './state/useAlert';

const meta: Meta = {
  title: 'Components/Alert',
};

export default meta;

type Story = StoryObj;

export const AlertDemo: Story = {
  parameters: {
    layout: null,
  },
  render: () => {
    const Demo = () => {
      const { showAlert } = useAlert();

      return (
        <SbkPanel className="mt-32 flex gap-8">
          <SbkButton
            className="bg-green-400"
            onClick={() =>
              showAlert({ content: 'Hello Success message', type: 'success' })
            }
          >
            Show Success
          </SbkButton>
          <SbkButton
            className="bg-red-400"
            onClick={() =>
              showAlert({ content: 'Hello Error message', type: 'error' })
            }
          >
            Show Error
          </SbkButton>
        </SbkPanel>
      );
    };

    return (
      <>
        <Demo />
        <Alert />
      </>
    );
  },
};
