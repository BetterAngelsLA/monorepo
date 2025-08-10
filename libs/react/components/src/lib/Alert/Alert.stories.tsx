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
import { SbButton, SbList } from '../../storybook';
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
        <SbList>
          <SbButton
            classname="bg-green-400"
            onClick={() =>
              showAlert({ content: 'Hello Success message', type: 'success' })
            }
          >
            Show Success
          </SbButton>
          <SbButton
            classname="bg-red-400"
            onClick={() =>
              showAlert({ content: 'Hello Error message', type: 'error' })
            }
          >
            Show Error
          </SbButton>
        </SbList>
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
