import { useState } from 'react';
import { JSX } from 'react/jsx-runtime';
import Button from '../Button';
import { ActionModal, IActionModalProps } from './ActionModal';

/**
 * A small story‑wrapper that owns its own `visible` state
 * and lets all ActionModal props be optional.
 */
const ActionModalStoryComponent = (args: Partial<IActionModalProps> = {}) => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Button
        title="Show Modal"
        variant="primary"
        onPress={() => setVisible(true)}
        accessibilityHint="Open modal"
      />
      <ActionModal
        {...args}
        title={args.title ?? 'Title'}
        subtitle={args.subtitle ?? 'Subtitle'}
        primaryButtonTitle={args.primaryButtonTitle ?? 'Confirm'}
        secondaryButtonTitle={args.secondaryButtonTitle ?? 'Cancel'}
        visible={visible}
        setVisible={setVisible}
        onClose={() => setVisible(false)}
        onPrimaryPress={
          args.onPrimaryPress ?? (() => console.log('Primary pressed'))
        }
        onSecondaryPress={
          args.onSecondaryPress ?? (() => console.log('Secondary pressed'))
        }
      />
    </>
  );
};

export default {
  title: 'ActionModal',
  component: ActionModal,
};

export const Basic = {
  args: {}, // no required props
  render: (args: JSX.IntrinsicAttributes & Partial<IActionModalProps>) => (
    <ActionModalStoryComponent {...args} />
  ),
};
