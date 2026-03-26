import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '../buttons/buttons';
import { Text } from '../text/text';
import { ConfirmationModal } from './ConfirmationModal';
import { Modal, TModalSize } from './Modal';
import { ModalBody } from './ModalBody';
import { ModalFooter } from './ModalFooter';
import { ModalHeader } from './ModalHeader';

const meta: Meta = {
  title: 'Base UI/Modal',
};
export default meta;

type Story = StoryObj;

type ModalStoryArgs = {
  size: TModalSize;
  title: string;
  bodyContent: string;
};

type ConfirmationStoryArgs = {
  title: string;
  description: string;
};

type ScrollableStoryArgs = {
  size: TModalSize;
  title: string;
  paragraphs: number;
};

export const BaseModal: Story = {
  args: {
    size: 'md',
    title: 'Modal Title',
    bodyContent:
      'This is a base modal with header, body, and footer sections. You can compose these building blocks to create any type of modal.',
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
    },
    title: { control: 'text' },
    bodyContent: { control: 'text' },
  },
  render: (args) => {
    const typedArgs = args as ModalStoryArgs;
    const Demo = () => {
      const [isOpen, setIsOpen] = useState(true);

      return (
        <>
          <Button
            variant="primary"
            color="blue"
            onClick={() => setIsOpen(true)}
          >
            Open Modal
          </Button>
          <Modal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            size={typedArgs.size}
          >
            <ModalHeader onClose={() => setIsOpen(false)}>
              <Text variant="header-md" className="font-semibold">
                {typedArgs.title}
              </Text>
            </ModalHeader>
            <ModalBody>
              <Text variant="body-lg" className="text-[#747A82]">
                {typedArgs.bodyContent}
              </Text>
            </ModalBody>
            <ModalFooter>
              <Button variant="primary" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                color="blue"
                onClick={() => setIsOpen(false)}
              >
                Confirm
              </Button>
            </ModalFooter>
          </Modal>
        </>
      );
    };

    return <Demo />;
  },
};

export const BottomButtons: Story = {
  args: {
    size: 'lg',
    title: 'Select Shelters',
    bodyContent: 'Content area',
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
    },
    title: { control: 'text' },
    bodyContent: { control: 'text' },
  },
  render: (args) => {
    const typedArgs = args as ModalStoryArgs;
    const Demo = () => {
      const [isOpen, setIsOpen] = useState(true);

      return (
        <>
          <Button
            variant="primary"
            color="blue"
            onClick={() => setIsOpen(true)}
          >
            Open Modal
          </Button>
          <Modal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            size={typedArgs.size}
          >
            <ModalHeader showCloseButton={false}>
              <Text variant="header-md" className="font-semibold">
                {typedArgs.title}
              </Text>
            </ModalHeader>
            <ModalBody className="min-h-[200px]">
              <Text variant="body-lg" className="text-[#747A82]">
                {typedArgs.bodyContent}
              </Text>
            </ModalBody>
            <ModalFooter className="justify-between">
              <Button variant="primary" onClick={() => setIsOpen(false)}>
                Back
              </Button>
              <div className="flex gap-3">
                <Button variant="primary">Clear All</Button>
                <Button variant="primary" color="blue">
                  Show 11 Shelters
                </Button>
              </div>
            </ModalFooter>
          </Modal>
        </>
      );
    };

    return <Demo />;
  },
};

export const ConfirmationDanger: Story = {
  args: {
    title: 'Are you sure you want to delete Shelter Organization Name?',
    description: 'This action cannot be undone.',
  },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
  },
  render: (args) => {
    const typedArgs = args as ConfirmationStoryArgs;
    const Demo = () => {
      const [isOpen, setIsOpen] = useState(true);

      return (
        <>
          <Button variant="primary" onClick={() => setIsOpen(true)} color="red">
            Delete Item
          </Button>
          <ConfirmationModal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            variant="danger"
            title={typedArgs.title}
            description={typedArgs.description}
            primaryAction={{
              label: 'Delete',
              onClick: () => setIsOpen(false),
            }}
            secondaryAction={{
              label: 'Cancel',
              onClick: () => setIsOpen(false),
            }}
          />
        </>
      );
    };

    return <Demo />;
  },
};

export const ConfirmationSuccess: Story = {
  args: {
    title: 'Are you sure you want to confirm?',
    description: 'text',
  },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
  },
  render: (args) => {
    const typedArgs = args as ConfirmationStoryArgs;
    const Demo = () => {
      const [isOpen, setIsOpen] = useState(true);

      return (
        <>
          <Button variant="primary" onClick={() => setIsOpen(true)}>
            Confirm Action
          </Button>
          <ConfirmationModal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            variant="success"
            title={typedArgs.title}
            description={typedArgs.description}
            primaryAction={{
              label: 'Confirm',
              onClick: () => setIsOpen(false),
            }}
            secondaryAction={{
              label: 'Cancel',
              onClick: () => setIsOpen(false),
            }}
          />
        </>
      );
    };

    return <Demo />;
  },
};

export const ConfirmationInfo: Story = {
  args: {
    title: 'Information',
    description: 'This is an informational confirmation dialog.',
  },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
  },
  render: (args) => {
    const typedArgs = args as ConfirmationStoryArgs;
    const Demo = () => {
      const [isOpen, setIsOpen] = useState(true);

      return (
        <>
          <Button
            variant="primary"
            color="blue"
            onClick={() => setIsOpen(true)}
          >
            Info Action
          </Button>
          <ConfirmationModal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            variant="info"
            title={typedArgs.title}
            description={typedArgs.description}
            primaryAction={{
              label: 'OK',
              onClick: () => setIsOpen(false),
            }}
            secondaryAction={{
              label: 'Cancel',
              onClick: () => setIsOpen(false),
            }}
          />
        </>
      );
    };

    return <Demo />;
  },
};

const LONG_CONTENT_PARAGRAPHS = Array.from(
  { length: 8 },
  (_, i) =>
    `Paragraph ${
      i + 1
    }: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.`
);

export const ScrollableContent: Story = {
  args: {
    size: 'md',
    title: 'Scrollable Modal',
    paragraphs: 8,
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
    },
    title: { control: 'text' },
    paragraphs: {
      control: { type: 'range', min: 1, max: 20, step: 1 },
    },
  },
  render: (args) => {
    const typedArgs = args as ScrollableStoryArgs;
    const Demo = () => {
      const [isOpen, setIsOpen] = useState(true);
      const content = Array.from(
        { length: typedArgs.paragraphs },
        (_, i) => LONG_CONTENT_PARAGRAPHS[i % LONG_CONTENT_PARAGRAPHS.length]
      );

      return (
        <>
          <Button
            variant="primary"
            color="blue"
            onClick={() => setIsOpen(true)}
          >
            Open Scrollable Modal
          </Button>
          <Modal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            size={typedArgs.size}
          >
            <ModalHeader onClose={() => setIsOpen(false)}>
              <Text variant="header-md" className="font-semibold">
                {typedArgs.title}
              </Text>
            </ModalHeader>
            <ModalBody>
              {content.map((text, i) => (
                <Text key={i} variant="body" className="text-[#747A82] mb-4">
                  {text}
                </Text>
              ))}
            </ModalBody>
            <ModalFooter>
              <Button variant="primary" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                color="blue"
                onClick={() => setIsOpen(false)}
              >
                Save
              </Button>
            </ModalFooter>
          </Modal>
        </>
      );
    };

    return <Demo />;
  },
};
