import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import Button from '../Button';
import { ActionModal, IActionModalProps } from './ActionModal';

const meta: Meta<typeof ActionModal> = {
  title: 'ActionModal',
  component: ActionModal,
};

export default meta;

type ActionModalStory = StoryObj<typeof ActionModal>;

const ActionModalStoryComponent = (args: IActionModalProps) => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Button
        title="show modal"
        variant="primary"
        onPress={() => setVisible(true)}
        accessibilityHint={'open modal'}
      />
      <ActionModal
        {...args}
        title="title"
        subtitle="subtitle"
        primaryButtonTitle="p title"
        secondaryButtonTitle="s title"
        visible={visible}
        setVisible={setVisible}
        onPrimaryPress={() => {
          console.log('Primary Button Pressed');
        }}
        onSecondaryPress={() => {
          console.log('Secondary Button Pressed');
        }}
      />
    </>
  );
};

export const Basic: ActionModalStory = {
  render: (args) => <ActionModalStoryComponent {...args} />,
};
