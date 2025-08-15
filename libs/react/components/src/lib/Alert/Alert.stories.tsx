import { SbkPage, decorateWith } from '@monorepo/storybook-web';
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
  parameters: {
    layout: null,
  },
  decorators: [decorateWith(SbkPage)],
  render: () => {
    const Demo = () => {
      const { showAlert } = useAlert();

      return (
        <div className="mt-32 flex justify-between gap-8">
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
        </div>
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
