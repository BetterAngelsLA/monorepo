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
    onStepClick: (index) => alert(`Navigating to step ${index + 1}`),
    currentStep: 0,
  },
};

export const SecondStep: Story = {
  args: {
    steps: defaultSteps,
    onStepClick: (index) => alert(`Navigating to step ${index + 1}`),
    currentStep: 1,
  },
};

export const ThirdStep: Story = {
  args: {
    steps: defaultSteps,
    onStepClick: (index) => alert(`Navigating to step ${index + 1}`),
    currentStep: 2,
  },
};

export const LastStep: Story = {
  args: {
    steps: defaultSteps,
    onStepClick: (index) => alert(`Navigating to step ${index + 1}`),
    currentStep: 3,
  },
};

export const Completed: Story = {
  args: {
    steps: defaultSteps,
    onStepClick: (index) => alert(`Navigating to step ${index + 1}`),
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
    onStepClick: (index) => alert(`Navigating to step ${index + 1}`),
    currentStep: 0,
  },
};

export const ManyStepsMiddle: Story = {
  args: {
    steps: manySteps,
    onStepClick: (index) => alert(`Navigating to step ${index + 1}`),
    currentStep: 4,
  },
};
