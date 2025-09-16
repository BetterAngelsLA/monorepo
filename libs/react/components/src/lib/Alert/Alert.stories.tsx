import { SbkButton } from '@monorepo/react/storybook';
import type { Meta, StoryObj } from '@storybook/react';
import { Alert } from './Alert';
import { useAlert } from './state/useAlert';

const meta: Meta = {
  title: 'Alert',
};

export default meta;

type Story = StoryObj;

export const AlertDemo: Story = {
  parameters: {
    customLayout: {
      canvasStyle: { width: 400 },
    },
  },
  render: () => {
    const Demo = () => {
      const { showAlert } = useAlert();

      return (
        <>
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
        </>
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
