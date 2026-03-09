import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
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
    const Demo = () => {
      const [isOpen, setIsOpen] = useState(true);

      return (
        <>
          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 bg-[#008CEE] text-white rounded-lg"
          >
            Open Modal
          </button>
          <Modal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            size={args.size as TModalSize}
          >
            <ModalHeader onClose={() => setIsOpen(false)}>
              <h3 className="text-lg font-semibold">{args.title}</h3>
            </ModalHeader>
            <ModalBody>
              <p className="text-[#747A82]">{args.bodyContent}</p>
            </ModalBody>
            <ModalFooter>
              <button
                onClick={() => setIsOpen(false)}
                className="px-5 py-2 rounded-lg text-sm font-medium border border-[#D3D9E3] text-[#383B40] hover:bg-[#F4F6FD]"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-[#008CEE] hover:bg-[#0374c4]"
              >
                Confirm
              </button>
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
    const Demo = () => {
      const [isOpen, setIsOpen] = useState(true);

      return (
        <>
          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 bg-[#008CEE] text-white rounded-lg"
          >
            Open Modal
          </button>
          <Modal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            size={args.size as TModalSize}
          >
            <ModalHeader showCloseButton={false}>
              <h3 className="text-lg font-semibold">{args.title}</h3>
            </ModalHeader>
            <ModalBody className="min-h-[200px]">
              <p className="text-[#747A82]">{args.bodyContent}</p>
            </ModalBody>
            <ModalFooter className="justify-between">
              <button
                onClick={() => setIsOpen(false)}
                className="px-5 py-2 rounded-lg text-sm font-medium border border-[#D3D9E3] text-[#747A82] hover:bg-[#F4F6FD]"
              >
                Back
              </button>
              <div className="flex gap-3">
                <button className="px-5 py-2 rounded-lg text-sm font-medium border border-[#D3D9E3] text-[#747A82] hover:bg-[#F4F6FD]">
                  Clear All
                </button>
                <button className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-[#008CEE] hover:bg-[#0374c4]">
                  Show 11 Shelters
                </button>
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
    const Demo = () => {
      const [isOpen, setIsOpen] = useState(true);

      return (
        <>
          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 bg-[#CB0808] text-white rounded-lg"
          >
            Delete Item
          </button>
          <ConfirmationModal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            variant="danger"
            title={args.title}
            description={args.description}
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
    const Demo = () => {
      const [isOpen, setIsOpen] = useState(true);

      return (
        <>
          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 bg-[#23CE6B] text-white rounded-lg"
          >
            Confirm Action
          </button>
          <ConfirmationModal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            variant="success"
            title={args.title}
            description={args.description}
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
    const Demo = () => {
      const [isOpen, setIsOpen] = useState(true);

      return (
        <>
          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 bg-[#008CEE] text-white rounded-lg"
          >
            Info Action
          </button>
          <ConfirmationModal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            variant="info"
            title={args.title}
            description={args.description}
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
    `Paragraph ${i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.`
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
    const Demo = () => {
      const [isOpen, setIsOpen] = useState(true);
      const content = Array.from(
        { length: args.paragraphs },
        (_, i) =>
          LONG_CONTENT_PARAGRAPHS[i % LONG_CONTENT_PARAGRAPHS.length]
      );

      return (
        <>
          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 bg-[#008CEE] text-white rounded-lg"
          >
            Open Scrollable Modal
          </button>
          <Modal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            size={args.size as TModalSize}
          >
            <ModalHeader onClose={() => setIsOpen(false)}>
              <h3 className="text-lg font-semibold">{args.title}</h3>
            </ModalHeader>
            <ModalBody>
              {content.map((text, i) => (
                <p key={i} className="text-[#747A82] mb-4">
                  {text}
                </p>
              ))}
            </ModalBody>
            <ModalFooter>
              <button
                onClick={() => setIsOpen(false)}
                className="px-5 py-2 rounded-lg text-sm font-medium border border-[#D3D9E3] text-[#383B40] hover:bg-[#F4F6FD]"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-[#008CEE] hover:bg-[#0374c4]"
              >
                Save
              </button>
            </ModalFooter>
          </Modal>
        </>
      );
    };

    return <Demo />;
  },
};
