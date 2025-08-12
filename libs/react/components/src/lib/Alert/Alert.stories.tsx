import type { Meta, StoryObj } from '@storybook/react';
import { SbButton } from '../../storybook';
import { Alert } from './Alert';
import { useAlert } from './state/useAlert';

const meta: Meta = {
  title: 'Components/Alert',
};

export default meta;

type Story = StoryObj;

export const AlertDemo: Story = {
  render: () => {
    const Demo = () => {
      const { showAlert } = useAlert();

      return (
        <>
          <SbButton
            className="bg-green-400"
            onClick={() =>
              showAlert({ content: 'Hello Success message', type: 'success' })
            }
          >
            Show Success
          </SbButton>
          <SbButton
            className="bg-red-400"
            onClick={() =>
              showAlert({ content: 'Hello Error message', type: 'error' })
            }
          >
            Show Error
          </SbButton>
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
