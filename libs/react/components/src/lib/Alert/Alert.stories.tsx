/** Global Alert component
 *
 * #### Usage ####
 *
 * 1. include <Alert /> in App layout
 * 2. Use `showAlert` from `useAlert` hook:
 *
 *   const { showAlert } = useAlert();
 *
 *   showAlert({
 *      content: 'Hello message',
 *      type: 'success',
 *    });
 * */

import type { Meta, StoryObj } from '@storybook/react';
import { Alert } from './Alert';
import { useAlert } from './state/useAlert';

const meta: Meta = {
  title: 'Playground/Alert Demo',
};
export default meta;

type Story = StoryObj;

export const LocalAlert: Story = {
  render: () => {
    const Demo = () => {
      const { showAlert } = useAlert();

      return (
        <div>
          <button
            className="bg-green-400 p-2 rounded text-white"
            onClick={() =>
              showAlert({ content: 'Hello Success message', type: 'success' })
            }
          >
            Show Success
          </button>
          <button
            className="bg-red-400 p-2 rounded text-white"
            onClick={() =>
              showAlert({ content: 'Hello Error message', type: 'error' })
            }
          >
            <div>Show Error</div>
          </button>
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
