import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import {
  WizardProgressBar,
  type WizardProgressBarProps,
} from './WizardProgressBar';

const meta: Meta<WizardProgressBarProps> = {
  component: WizardProgressBar,
  title: 'Wizard/WizardProgressBar',
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="p-8 w-[700px]">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<WizardProgressBarProps>;

const defaultSteps = [
  { label: 'Add Profile' },
  { label: 'Select Shelter' },
  { label: 'Select Room or Bed' },
  { label: 'Confirmation' },
];

export const FirstStep: Story = {
  args: {
    steps: defaultSteps,
    currentStep: 0,
  },
};

export const SecondStep: Story = {
  args: {
    steps: defaultSteps,
    currentStep: 1,
  },
};

export const ThirdStep: Story = {
  args: {
    steps: defaultSteps,
    currentStep: 2,
  },
};

export const LastStep: Story = {
  args: {
    steps: defaultSteps,
    currentStep: 3,
  },
};

export const Completed: Story = {
  args: {
    steps: defaultSteps,
    currentStep: 4,
  },
};

const manySteps = [
  { label: '' },
  { label: '' },
  { label: '' },
  { label: '' },
  { label: '' },
  { label: '' },
  { label: '' },
  { label: '' },
];

export const ManySteps: Story = {
  args: {
    steps: manySteps,
    currentStep: 0,
  },
};

export const ManyStepsMiddle: Story = {
  args: {
    steps: manySteps,
    currentStep: 4,
  },
};

export const WithNavigationButtons: Story = {
  args: {
    steps: defaultSteps,
    currentStep: 1,
    navigationButtons: {
      showBack: true,
      showNext: true,
      onBack: () => alert('Going back!'),
      onNext: () => alert('Going forward!'),
    },
  },
};

export const FirstStepWithNextOnly: Story = {
  args: {
    steps: defaultSteps,
    currentStep: 0,
    navigationButtons: {
      showBack: false,
      showNext: true,
      onNext: () => alert('Proceeding to next step!'),
    },
  },
};

export const LastStepWithSubmit: Story = {
  args: {
    steps: defaultSteps,
    currentStep: 3,
    navigationButtons: {
      showBack: true,
      showNext: true,
      nextLabel: 'Submit',
      onBack: () => alert('Going back!'),
      onNext: () => alert('Submitting form!'),
    },
  },
};

export const WithDisabledNext: Story = {
  args: {
    steps: defaultSteps,
    currentStep: 1,
    navigationButtons: {
      showBack: true,
      showNext: true,
      nextDisabled: true,
      onBack: () => alert('Going back!'),
      onNext: () => alert('This should not fire'),
    },
  },
};

export const WithCustomLabels: Story = {
  args: {
    steps: defaultSteps,
    currentStep: 2,
    navigationButtons: {
      showBack: true,
      showNext: true,
      backLabel: 'Previous',
      nextLabel: 'Continue',
      onBack: () => alert('Going to previous step!'),
      onNext: () => alert('Continuing!'),
    },
  },
};

export const BackButtonOnly: Story = {
  args: {
    steps: defaultSteps,
    currentStep: 2,
    navigationButtons: {
      showBack: true,
      showNext: false,
      onBack: () => alert('Going back!'),
    },
  },
};
