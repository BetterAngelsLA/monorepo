import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ConfirmationModal } from './ConfirmationModal';
import { Modal } from './Modal';
import { ModalBody } from './ModalBody';
import { ModalFooter } from './ModalFooter';
import { ModalHeader } from './ModalHeader';

const meta: Meta = {
  title: 'Base UI/Modal',
};
export default meta;

type Story = StoryObj;

export const BaseModal: Story = {
  render: () => {
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
          <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="md">
            <ModalHeader onClose={() => setIsOpen(false)}>
              <h3 className="text-lg font-semibold">Modal Title</h3>
            </ModalHeader>
            <ModalBody>
              <p className="text-[#747A82]">
                This is a base modal with header, body, and footer sections. You
                can compose these building blocks to create any type of modal.
              </p>
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
  render: () => {
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
          <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="lg">
            <ModalHeader showCloseButton={false}>
              <h3 className="text-lg font-semibold">Select Shelters</h3>
            </ModalHeader>
            <ModalBody className="min-h-[200px]">
              <p className="text-[#747A82]">Content area</p>
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
  render: () => {
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
            title="Are you sure you want to delete Shelter Organization Name?"
            description="This action cannot be undone."
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
  render: () => {
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
            title="Are you sure you want to confirm?"
            description="text"
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
  render: () => {
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
            title="Information"
            description="This is an informational confirmation dialog."
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
