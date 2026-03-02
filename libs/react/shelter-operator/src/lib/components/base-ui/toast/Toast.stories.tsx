import type { Meta, StoryObj } from '@storybook/react';
import { Toast } from './Toast';
import { ToastContainer } from './ToastContainer';
import { useToast } from './state/useToast';

const meta: Meta = {
  title: 'Base UI/Toast',
};
export default meta;

type Story = StoryObj;

export const ErrorToast: Story = {
  render: () => (
    <Toast
      status="error"
      title="Error Toast"
      description="Error Message"
      action={{ label: 'Action', onClick: () => undefined }}
      onClose={() => undefined}
    />
  ),
};

export const WarningToast: Story = {
  render: () => (
    <Toast
      status="warning"
      title="Warning Toast"
      description="Warning Message"
      action={{ label: 'Action', onClick: () => undefined }}
      onClose={() => undefined}
    />
  ),
};

export const SuccessToast: Story = {
  render: () => (
    <Toast
      status="success"
      title="Success Toast"
      description="Error Message"
      action={{ label: 'Success', onClick: () => undefined }}
      onClose={() => undefined}
    />
  ),
};

export const InfoToast: Story = {
  render: () => (
    <Toast
      status="info"
      title="Info Toast"
      description="Info Message"
      action={{ label: 'Action', onClick: () => undefined }}
      onClose={() => undefined}
    />
  ),
};

export const ToastDemo: Story = {
  render: () => {
    const Demo = () => {
      const { showToast } = useToast();

      return (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              className="px-4 py-2 bg-[#CB0808] text-white rounded-lg text-sm"
              onClick={() =>
                showToast({
                  status: 'error',
                  title: 'Error Toast',
                  description: 'Something went wrong.',
                  action: { label: 'Retry', onClick: () => undefined },
                })
              }
            >
              Show Error
            </button>
            <button
              className="px-4 py-2 bg-[#FFC700] text-white rounded-lg text-sm"
              onClick={() =>
                showToast({
                  status: 'warning',
                  title: 'Warning Toast',
                  description: 'Please check your input.',
                  action: { label: 'Review', onClick: () => undefined },
                })
              }
            >
              Show Warning
            </button>
            <button
              className="px-4 py-2 bg-[#23CE6B] text-white rounded-lg text-sm"
              onClick={() =>
                showToast({
                  status: 'success',
                  title: 'Success Toast',
                  description: 'Action completed successfully.',
                  action: { label: 'View', onClick: () => undefined },
                })
              }
            >
              Show Success
            </button>
            <button
              className="px-4 py-2 bg-[#008CEE] text-white rounded-lg text-sm"
              onClick={() =>
                showToast({
                  status: 'info',
                  title: 'Info Toast',
                  description: 'Here is some info for you.',
                  action: { label: 'Details', onClick: () => undefined },
                })
              }
            >
              Show Info
            </button>
          </div>
          <ToastContainer />
        </>
      );
    };

    return <Demo />;
  },
};
